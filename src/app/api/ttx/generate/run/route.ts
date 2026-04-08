export const maxDuration = 60;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateTtxScenario } from "@/lib/ai/generate-ttx";
import { generateChannelName } from "@/lib/utils";

export async function POST(req: NextRequest) {
  // Verify internal call
  const secret = req.headers.get("x-internal-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    sessionId, orgId, orgName, userId, userEmail,
    theme, difficulty, mode, questionCount, mitreAttackIds,
    characters, securityTools, orgProfile,
    customIncident, language, threatActorId,
  } = body;

  try {
    console.log(`[generate/run] Starting AI generation for session ${sessionId}, org: ${orgName}`);

    // Get recent titles
    const recentSessions = await db.ttxSession.findMany({
      where: { orgId, status: "COMPLETED" },
      select: { title: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    const recentTitles = recentSessions.map(s => s.title).filter(Boolean);

    // Past performance
    let pastPerformance = null;
    try {
      const { analyzePastPerformance } = await import("@/lib/ai/generate-ttx");
      pastPerformance = await analyzePastPerformance(orgId, db);
    } catch {}


    // Generate scenario
    const scenario = await generateTtxScenario({
      theme, difficulty,
      mitreAttackIds: mitreAttackIds || [],
      securityTools: securityTools || [],
      questionCount: questionCount || 10,
      orgProfile: orgProfile || null,
      orgName,
      characters: characters || [],
      pastPerformance,
      customIncident,
      recentTitles,
      language: language || "en",
    });

    // Update session
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

    console.log(`[generate/run] Session ${sessionId} completed: ${scenario.title}`);

    // Email notification
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

    return NextResponse.json({ success: true, title: scenario.title });

  } catch (error: any) {
    console.error(`[generate/run] FAILED for session ${sessionId}:`, error?.message || error);
    await db.ttxSession.update({ where: { id: sessionId }, data: { status: "CANCELLED" } });
    return NextResponse.json({ error: error?.message || "Generation failed" }, { status: 500 });
  }
}
