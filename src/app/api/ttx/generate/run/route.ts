export const maxDuration = 300;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateTtxScenario } from "@/lib/ai/generate-ttx";
import { generateChannelName } from "@/lib/utils";
import { getOrgAIProvider } from "@/lib/ai/get-org-provider";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    sessionId, orgId, orgName, userId, userEmail,
    theme, difficulty, mode, questionCount, mitreAttackIds,
    characters, securityTools, orgProfile, customIncident, language,
  } = body;

  async function setStatus(msg: string) {
    try { await db.ttxSession.update({ where: { id: sessionId }, data: { title: msg } }); } catch {}
  }

  try {
    const startTime = Date.now();
    console.log("[generate/run] Starting for session " + sessionId);

    await setStatus("Connecting to AI engine...");

    const recentSessions = await db.ttxSession.findMany({
      where: { orgId, status: "COMPLETED" },
      select: { title: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    const recentTitles = recentSessions.map(s => s.title).filter(Boolean);

    await setStatus("Analysing your security profile...");

    let pastPerformance = null;
    try {
      const { analyzePastPerformance } = await import("@/lib/ai/generate-ttx");
      pastPerformance = await analyzePastPerformance(orgId, db);
    } catch {}

    const providerConfig = await getOrgAIProvider(orgId);
    const isDefault = providerConfig.provider === "anthropic" && providerConfig.apiKey === process.env.ANTHROPIC_API_KEY;

    await setStatus("Generating incident scenario with AI...");

    const scenario = await generateTtxScenario({
      theme, difficulty,
      mitreAttackIds: mitreAttackIds || [],
      securityTools: securityTools || [],
      questionCount: questionCount || 12,
      orgProfile: orgProfile || null,
      orgName,
      characters: characters || [],
      pastPerformance,
      customIncident,
      recentTitles,
      language: language || "en",
      providerConfig: isDefault ? undefined : providerConfig,
    });

    const qCount = scenario.stages?.reduce((n: number, s: any) => n + (s.questions?.length || 0), 0) || 0;
    await setStatus("Finalising " + qCount + " questions across " + (scenario.stages?.length || 0) + " stages...");

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
    console.log("[generate/run] Completed in " + elapsed + "s: " + scenario.title);

    if (process.env.RESEND_API_KEY && userEmail) {
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "ThreatCast <noreply@threatcast.io>",
          to: [userEmail],
          subject: "Your exercise is ready: " + scenario.title,
          html: "<div style=\"font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto;padding:40px 20px;\"><div style=\"font-family:monospace;font-size:18px;font-weight:800;letter-spacing:2px;margin-bottom:24px;\"><span style=\"color:#f0f0f0;\">THREAT</span><span style=\"color:#00ffd5;\">CAST</span></div><h2>Your exercise is ready!</h2><p><strong>" + scenario.title + "</strong> has been generated.</p><a href=\"https://threatcast.io/portal/ttx/" + sessionId + "\" style=\"display:inline-block;background:#14b89a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;\">Launch Exercise</a></div>",
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, elapsed });
  } catch (error: any) {
    console.error("[generate/run] FAILED:", error?.message || error);
    await db.ttxSession.update({ where: { id: sessionId }, data: { status: "CANCELLED" } });
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
