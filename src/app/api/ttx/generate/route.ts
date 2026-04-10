export const maxDuration = 300;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse, after } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { checkExerciseLimit } from "@/lib/plan-limits";

// ARCHITECTURE:
// 1. POST /api/ttx/generate — creates session, returns ID in <2 seconds
// 2. after() runs the AI generation in the background (60-90s)
// 3. Client redirects to /portal/ttx/[id] which polls for completion
// 4. Session page shows trivia game while status is GENERATING
//
// after() is Next.js 15+ native. Runs after response is sent.
// maxDuration=300 covers both the response AND the after() callback.
// The client NEVER waits for the AI — it polls instead.

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rl = rateLimit("generate:" + user.id, 10, 60 * 60 * 1000);
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });

    const org = await db.organization.findUnique({
      where: { id: user.orgId },
      include: { securityTools: { include: { tool: true } }, profile: true },
    });
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

    const planCheck = await checkExerciseLimit(org.id);
    if (!planCheck.allowed) {
      return NextResponse.json({ error: "Monthly limit reached (" + planCheck.used + "/" + planCheck.limit + ")." }, { status: 429 });
    }

    await db.ttxSession.updateMany({
      where: { createdById: user.id, status: "GENERATING", createdAt: { lt: new Date(Date.now() - 5 * 60 * 1000) } },
      data: { status: "CANCELLED" },
    });

    const body = await req.json();
    const { theme, difficulty, mode, questionCount, mitreAttackIds, selectedCharacters, customIncident, language } = body;

    const session = await db.ttxSession.create({
      data: {
        orgId: org.id, title: "Generating...", difficulty, theme,
        mitreAttackIds: mitreAttackIds || [], mode: mode || "GROUP",
        status: "GENERATING", questionCount: questionCount || 12,
        createdById: user.id, channelName: null,
      },
    });

    // Capture all values for the after() closure
    const sessionId = session.id;
    const userId = user.id;
    const userEmail = user.email;
    const orgId = org.id;
    const orgName = org.name;
    const securityTools = org.securityTools.map((ost: any) => ({
      name: ost.tool.name, vendor: ost.tool.vendor, category: ost.tool.category,
    }));
    const orgProfile = org.profile || null;
    const characters = (selectedCharacters || []).map((c: any) => ({
      name: c.name, role: c.role, department: c.department || undefined,
      description: c.description || undefined, expertise: c.expertise || [],
    }));
    const qCount = questionCount || 12;
    const mIds = mitreAttackIds || [];
    const lang = language || "en";
    const sessionMode = mode || "GROUP";

    // Schedule background AI generation AFTER response is sent
    after(async () => {
      const startTime = Date.now();
      try {
        console.log("[generate/after] Started for " + sessionId);

        const { generateTtxScenario, analyzePastPerformance } = await import("@/lib/ai/generate-ttx");
        const { generateChannelName } = await import("@/lib/utils");
        const { getOrgAIProvider } = await import("@/lib/ai/get-org-provider");

        const recentSessions = await db.ttxSession.findMany({
          where: { orgId, status: "COMPLETED" },
          select: { title: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        });

        let pastPerformance = null;
        try { pastPerformance = await analyzePastPerformance(orgId, db); } catch {}

        const providerConfig = await getOrgAIProvider(orgId);
        const isDefault = providerConfig.provider === "anthropic" && providerConfig.apiKey === process.env.ANTHROPIC_API_KEY;

        const scenario = await generateTtxScenario({
          theme, difficulty,
          mitreAttackIds: mIds,
          securityTools,
          questionCount: qCount,
          orgProfile: orgProfile as any,
          orgName,
          characters,
          pastPerformance,
          customIncident,
          recentTitles: recentSessions.map((s: any) => s.title).filter(Boolean),
          language: lang,
          providerConfig: isDefault ? undefined : providerConfig,
        });

        await db.ttxSession.update({
          where: { id: sessionId },
          data: {
            title: scenario.title,
            scenario: scenario as any,
            status: sessionMode === "INDIVIDUAL" ? "IN_PROGRESS" : "LOBBY",
            channelName: generateChannelName(sessionId),
          },
        });

        await db.ttxParticipant.create({ data: { sessionId, userId } });
        await db.organization.update({ where: { id: orgId }, data: { ttxUsedThisMonth: { increment: 1 } } });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log("[generate/after] SUCCESS in " + elapsed + "s: " + scenario.title);

        if (process.env.RESEND_API_KEY && userEmail) {
          fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "ThreatCast <noreply@threatcast.io>",
              to: [userEmail],
              subject: "Your exercise is ready: " + scenario.title,
              html: '<div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto;padding:40px 20px;"><h2>Your exercise is ready!</h2><p><strong>' + scenario.title + '</strong></p><a href="https://threatcast.io/portal/ttx/' + sessionId + '" style="display:inline-block;background:#14b89a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Launch Exercise</a></div>',
            }),
          }).catch(() => {});
        }
      } catch (error: any) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.error("[generate/after] FAILED in " + elapsed + "s: " + (error?.message || "unknown"));
        console.error("[generate/after] Stack:", error?.stack?.substring(0, 500));
        await db.ttxSession.update({ where: { id: sessionId }, data: { status: "CANCELLED" } }).catch(() => {});
      }
    });

    // Return immediately — client redirects to session page which polls
    return NextResponse.json({ id: session.id, status: "GENERATING" });
  } catch (error: any) {
    console.error("[generate] CRASH:", error?.message);
    return NextResponse.json({ error: "Generation failed: " + (error?.message || "unknown") }, { status: 500 });
  }
}
