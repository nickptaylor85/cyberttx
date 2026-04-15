export const maxDuration = 300;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateTtxScenario, analyzePastPerformance } from "@/lib/ai/generate-ttx";
import { generateChannelName } from "@/lib/utils";
import { getOrgAIProvider } from "@/lib/ai/get-org-provider";

// Called by the session page when it detects GENERATING status.
// Runs synchronously for 60-90s. Session page polls separately for completion.

export async function POST(req: NextRequest) {
  try {
    // Auth: accept either cron secret or valid user session
    const secret = req.headers.get("x-cron-secret");
    if (secret !== process.env.CRON_SECRET) {
      const { getAuthUser } = await import("@/lib/auth-helpers");
      const user = await getAuthUser();
      if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const sessionId = body.sessionId;
    if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

    const session = await db.ttxSession.findUnique({
      where: { id: sessionId },
      include: { organization: { include: { securityTools: { include: { tool: true } }, profile: true } } },
    });

    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (session.status !== "GENERATING") return NextResponse.json({ ok: true, status: session.status });

    console.log("[run] Starting generation for " + sessionId);
    const startTime = Date.now();

    const org = session.organization;
    const recentSessions = await db.ttxSession.findMany({
      where: { orgId: org.id, status: "COMPLETED" },
      select: { title: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    let pastPerformance = null;
    try { pastPerformance = await analyzePastPerformance(org.id, db); } catch {}

    const providerConfig = await getOrgAIProvider(org.id);
    const isDefault = providerConfig.provider === "anthropic" && providerConfig.apiKey === process.env.ANTHROPIC_API_KEY;

    const scenario = await generateTtxScenario({
      theme: session.theme || "ransomware",
      difficulty: session.difficulty as any,
      mitreAttackIds: (session.mitreAttackIds as string[]) || [],
      securityTools: org.securityTools.map((ost: any) => ({
        name: ost.tool.name, vendor: ost.tool.vendor, category: ost.tool.category,
      })),
      questionCount: session.questionCount || 12,
      orgProfile: (org.profile || null) as any,
      orgName: org.name,
      characters: [],
      pastPerformance,
      recentTitles: recentSessions.map((s: any) => s.title).filter(Boolean),
      language: "en",
      providerConfig: isDefault ? undefined : providerConfig,
    });

    await db.ttxSession.update({
      where: { id: sessionId },
      data: {
        title: scenario.title,
        scenario: scenario as any,
        status: session.mode === "INDIVIDUAL" ? "IN_PROGRESS" : "LOBBY",
        channelName: generateChannelName(sessionId),
      },
    });

    await db.ttxParticipant.create({ data: { sessionId, userId: session.createdById } }).catch(() => {});
    await db.organization.update({ where: { id: org.id }, data: { ttxUsedThisMonth: { increment: 1 } } });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log("[run] SUCCESS in " + elapsed + "s: " + scenario.title);

    return NextResponse.json({ ok: true, title: scenario.title });
  } catch (error: any) {
    console.error("[run] FAILED:", error?.message, error?.stack?.substring(0, 500));
    try {
      const b = await req.clone().json().catch(() => ({}));
      if ((b as any).sessionId) await db.ttxSession.update({ where: { id: (b as any).sessionId }, data: { status: "CANCELLED" } }).catch(() => {});
    } catch {}
    return NextResponse.json({ error: error?.message || "Generation failed" }, { status: 500 });
  }
}
