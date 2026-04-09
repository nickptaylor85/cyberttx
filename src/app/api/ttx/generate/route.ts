export const maxDuration = 300;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { rateLimit } from "@/lib/rate-limit";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { checkExerciseLimit } from "@/lib/plan-limits";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit("generate:" + user.id, 10, 60 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });

  const org = await db.organization.findUnique({
    where: { id: user.orgId },
    include: { securityTools: { include: { tool: true } }, profile: true },
  });
  if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

  const planCheck = await checkExerciseLimit(org.id);
  if (!planCheck.allowed) {
    return NextResponse.json({ error: `Monthly exercise limit reached (${planCheck.used}/${planCheck.limit}).` }, { status: 429 });
  }

  // Clean up stuck sessions
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

  // Capture all values needed in the background task before returning
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

  async function setStatus(msg: string) {
    try { await db.ttxSession.update({ where: { id: sessionId }, data: { title: msg } }); } catch {}
  }

  // waitUntil() keeps the Vercel function alive until the promise resolves,
  // even after the response has been sent. This is the correct pattern for
  // long-running background work on Vercel serverless.
  waitUntil((async () => {
    try {
      console.log("[generate] Starting generation for", sessionId);
      const startTime = Date.now();

      await setStatus("Connecting to AI engine...");

      // Dynamic imports inside callback — avoids module-level init issues
      const { generateTtxScenario, analyzePastPerformance } = await import("@/lib/ai/generate-ttx");
      const { generateChannelName } = await import("@/lib/utils");
      const { getOrgAIProvider } = await import("@/lib/ai/get-org-provider");

      const recentSessions = await db.ttxSession.findMany({
        where: { orgId, status: "COMPLETED" },
        select: { title: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
      const recentTitles = recentSessions.map((s: any) => s.title).filter(Boolean);

      let pastPerformance = null;
      try { pastPerformance = await analyzePastPerformance(orgId, db); } catch {}

      await setStatus("Analysing your security profile...");

      const providerConfig = await getOrgAIProvider(orgId);
      const isDefault = providerConfig.provider === "anthropic" && providerConfig.apiKey === process.env.ANTHROPIC_API_KEY;

      await setStatus("Generating incident scenario with AI...");

      const scenario = await generateTtxScenario({
        theme, difficulty,
        mitreAttackIds: mitreAttackIds || [],
        securityTools,
        questionCount: questionCount || 12,
        orgProfile,
        orgName,
        characters,
        pastPerformance,
        customIncident,
        recentTitles,
        language: language || "en",
        providerConfig: isDefault ? undefined : providerConfig,
      });

      await setStatus("Finalising exercise...");

      await db.ttxSession.update({
        where: { id: sessionId },
        data: {
          title: scenario.title,
          scenario: scenario as any,
          status: mode === "INDIVIDUAL" ? "IN_PROGRESS" : "LOBBY",
          channelName: generateChannelName(sessionId),
        },
      });

      await db.ttxParticipant.create({ data: { sessionId, userId } });
      await db.organization.update({ where: { id: orgId }, data: { ttxUsedThisMonth: { increment: 1 } } });

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[generate] Session ${sessionId} completed in ${elapsed}s: ${scenario.title}`);

      if (process.env.RESEND_API_KEY && userEmail) {
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "ThreatCast <noreply@threatcast.io>",
            to: [userEmail],
            subject: `Your "${scenario.title}" exercise is ready`,
            html: `<div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto;padding:40px 20px;"><div style="font-family:monospace;font-size:18px;font-weight:800;letter-spacing:2px;margin-bottom:24px;"><span style="color:#f0f0f0;">THREAT</span><span style="color:#00ffd5;">CAST</span></div><h2>Your exercise is ready!</h2><p>Your <strong>${scenario.title}</strong> tabletop exercise has been generated.</p><a href="https://threatcast.io/portal/ttx/${sessionId}" style="display:inline-block;background:#14b89a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Launch Exercise →</a></div>`,
          }),
        }).catch(() => {});
      }
    } catch (error: any) {
      console.error(`[generate] FAILED for session ${sessionId}:`, error?.message || error);
      try { await db.ttxSession.update({ where: { id: sessionId }, data: { status: "CANCELLED" } }); } catch {}
    }
  })());

  return NextResponse.json({ id: session.id, status: "GENERATING" });
}
