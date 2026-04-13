export const maxDuration = 300;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { checkExerciseLimit } from "@/lib/plan-limits";

// ARCHITECTURE:
// Returns session ID immediately. AI runs in background.
// On Azure App Service: the Node process stays alive, background work completes naturally.
// On Vercel: uses after() to keep the function alive after response.
// Client redirects to session page which polls for completion.

async function runGeneration(params: {
  sessionId: string; orgId: string; orgName: string; userId: string; userEmail: string;
  theme: string; difficulty: string; mode: string; questionCount: number;
  mitreAttackIds: string[]; securityTools: any[]; orgProfile: any;
  characters: any[]; customIncident?: string; language: string;
}) {
  const startTime = Date.now();
  try {
    console.log("[generate] Background started for " + params.sessionId);

    const { generateTtxScenario, analyzePastPerformance } = await import("@/lib/ai/generate-ttx");
    const { generateChannelName } = await import("@/lib/utils");
    const { getOrgAIProvider } = await import("@/lib/ai/get-org-provider");

    const recentSessions = await db.ttxSession.findMany({
      where: { orgId: params.orgId, status: "COMPLETED" },
      select: { title: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    let pastPerformance = null;
    try { pastPerformance = await analyzePastPerformance(params.orgId, db); } catch {}

    const providerConfig = await getOrgAIProvider(params.orgId);
    const isDefault = providerConfig.provider === "anthropic" && providerConfig.apiKey === process.env.ANTHROPIC_API_KEY;

    const scenario = await generateTtxScenario({
      theme: params.theme, difficulty: params.difficulty as any,
      mitreAttackIds: params.mitreAttackIds,
      securityTools: params.securityTools,
      questionCount: params.questionCount,
      orgProfile: params.orgProfile as any,
      orgName: params.orgName,
      characters: params.characters,
      pastPerformance,
      customIncident: params.customIncident,
      recentTitles: recentSessions.map((s: any) => s.title).filter(Boolean),
      language: params.language,
      providerConfig: isDefault ? undefined : providerConfig,
    });

    await db.ttxSession.update({
      where: { id: params.sessionId },
      data: {
        title: scenario.title,
        scenario: scenario as any,
        status: params.mode === "INDIVIDUAL" ? "IN_PROGRESS" : "LOBBY",
        channelName: generateChannelName(params.sessionId),
      },
    });

    await db.ttxParticipant.create({ data: { sessionId: params.sessionId, userId: params.userId } });
    await db.organization.update({ where: { id: params.orgId }, data: { ttxUsedThisMonth: { increment: 1 } } });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log("[generate] SUCCESS in " + elapsed + "s: " + scenario.title);

    if (process.env.RESEND_API_KEY && params.userEmail) {
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "ThreatCast <noreply@threatcast.io>",
          to: [params.userEmail],
          subject: "Your exercise is ready: " + scenario.title,
          html: '<div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto;padding:40px 20px;"><h2>Your exercise is ready!</h2><p><strong>' + scenario.title + '</strong></p><a href="https://threatcast.io/portal/ttx/' + params.sessionId + '" style="display:inline-block;background:#14b89a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Launch Exercise</a></div>',
        }),
      }).catch(() => {});
    }
  } catch (error: any) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error("[generate] FAILED in " + elapsed + "s: " + (error?.message || "unknown"));
    console.error("[generate] Stack:", error?.stack?.substring(0, 500));
    await db.ttxSession.update({ where: { id: params.sessionId }, data: { status: "CANCELLED" } }).catch(() => {});
  }
}

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

    const genParams = {
      sessionId: session.id,
      orgId: org.id,
      orgName: org.name,
      userId: user.id,
      userEmail: user.email,
      theme, difficulty,
      mode: mode || "GROUP",
      questionCount: questionCount || 12,
      mitreAttackIds: mitreAttackIds || [],
      securityTools: org.securityTools.map((ost: any) => ({
        name: ost.tool.name, vendor: ost.tool.vendor, category: ost.tool.category,
      })),
      orgProfile: org.profile || null,
      characters: (selectedCharacters || []).map((c: any) => ({
        name: c.name, role: c.role, department: c.department || undefined,
        description: c.description || undefined, expertise: c.expertise || [],
      })),
      customIncident,
      language: language || "en",
    };

    // Use after() if available (Vercel/Next.js 15), otherwise use Promise (Azure/Node.js)
    try {
      const { after } = await import("next/server");
      if (typeof after === "function") {
        after(runGeneration(genParams));
      } else {
        throw new Error("after not available");
      }
    } catch {
      // Fallback: fire-and-forget Promise — works on Azure/any persistent Node server
      runGeneration(genParams).catch(() => {});
    }

    return NextResponse.json({ id: session.id, status: "GENERATING" });
  } catch (error: any) {
    console.error("[generate] CRASH:", error?.message);
    return NextResponse.json({ error: "Generation failed: " + (error?.message || "unknown") }, { status: 500 });
  }
}
