import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import type { TtxScenario } from "@/types";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;

  const session = await db.ttxSession.findUnique({ where: { id: sessionId } });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // TENANT ISOLATION
  if (user.role !== "SUPER_ADMIN" && session.orgId !== user.orgId) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const updated = await db.ttxSession.update({
    where: { id: sessionId },
    data: { status: "COMPLETED", completedAt: new Date() },
    include: {
      participants: {
        include: { user: { select: { firstName: true, lastName: true } }, answers: true },
        orderBy: { totalScore: "desc" },
      },
    },
  });

  // Update ranks
  for (let i = 0; i < updated.participants.length; i++) {
    await db.ttxParticipant.update({ where: { id: updated.participants[i].id }, data: { rank: i + 1 } });
  }

  // Save feedback for AI learning
  try {
    const scenario = session.scenario as unknown as TtxScenario;
    const allAnswers = updated.participants.flatMap(p => p.answers);
    const totalCorrect = allAnswers.filter(a => a.isCorrect).length;
    const avgPercent = allAnswers.length > 0 ? (totalCorrect / allAnswers.length) * 100 : 0;

    await db.scenarioFeedback.create({
      data: {
        orgId: session.orgId, sessionId,
        avgScorePercent: avgPercent,
        themesUsed: session.theme ? [session.theme] : [],
        mitreUsed: session.mitreAttackIds || [],
        difficultyUsed: session.difficulty,
      },
    });
  } catch {}

  return NextResponse.json({ success: true });
}
