export const maxDuration = 300;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { checkExerciseLimit } from "@/lib/plan-limits";
import { generateTtxScenario } from "@/lib/ai/generate-ttx";
import { generateChannelName } from "@/lib/utils";

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

  try {
    const recentSessions = await db.ttxSession.findMany({
      where: { orgId: org.id, status: "COMPLETED" },
      select: { title: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    let pastPerformance = null;
    try {
      const { analyzePastPerformance } = await import("@/lib/ai/generate-ttx");
      pastPerformance = await analyzePastPerformance(org.id, db);
    } catch {}

    const scenario = await generateTtxScenario({
      theme, difficulty,
      mitreAttackIds: mitreAttackIds || [],
      securityTools: org.securityTools.map(ost => ({
        name: ost.tool.name, vendor: ost.tool.vendor, category: ost.tool.category,
      })),
      questionCount: questionCount || 12,
      orgProfile: (org.profile || null) as any,
      characters: (selectedCharacters || []).map((c: any) => ({
        name: c.name, role: c.role, department: c.department || undefined,
        description: c.description || undefined, expertise: c.expertise || [],
      })),
      pastPerformance,
      customIncident,
      recentTitles: recentSessions.map(s => s.title).filter(Boolean),
      language: language || "en",
    });

    await db.ttxSession.update({
      where: { id: session.id },
      data: {
        title: scenario.title,
        scenario: scenario as any,
        status: mode === "INDIVIDUAL" ? "IN_PROGRESS" : "LOBBY",
        channelName: generateChannelName(session.id),
      },
    });

    await db.ttxParticipant.create({ data: { sessionId: session.id, userId: user.id } });
    await db.organization.update({ where: { id: org.id }, data: { ttxUsedThisMonth: { increment: 1 } } });

    return NextResponse.json({ id: session.id, status: "READY" });
  } catch (error: any) {
    console.error("[generate] FAILED:", error?.message);
    await db.ttxSession.update({ where: { id: session.id }, data: { status: "CANCELLED" } });
    return NextResponse.json({ error: error?.message || "Generation failed" }, { status: 500 });
  }
  } catch (outerError: any) {
    console.error("[generate] OUTER CRASH:", outerError?.message, outerError?.stack?.slice(0, 300));
    return NextResponse.json({ error: "Server error: " + (outerError?.message || "unknown") }, { status: 500 });
  }
}
