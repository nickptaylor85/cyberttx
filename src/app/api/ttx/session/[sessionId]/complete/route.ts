import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { pusherServer, TTX_EVENTS } from "@/lib/pusher-server";
import type { TtxScenario } from "@/types";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  const session = await db.ttxSession.update({
    where: { id: sessionId },
    data: { status: "COMPLETED", completedAt: new Date() },
    include: {
      participants: {
        include: {
          user: { select: { firstName: true, lastName: true } },
          answers: true,
        },
        orderBy: { totalScore: "desc" },
      },
    },
  });

  // Update participant ranks
  for (let i = 0; i < session.participants.length; i++) {
    await db.ttxParticipant.update({
      where: { id: session.participants[i].id },
      data: { rank: i + 1 },
    });
  }

  // ============================================
  // AUTO-GENERATE PERFORMANCE FEEDBACK FOR AI LEARNING
  // ============================================
  try {
    const scenario = session.scenario as unknown as TtxScenario;
    const allAnswers = session.participants.flatMap((p) => p.answers);

    // Calculate per-question accuracy
    const questionStats: Record<string, { correct: number; total: number; stage: string; topic: string }> = {};

    scenario.stages.forEach((stage, si) => {
      stage.questions.forEach((q, qi) => {
        const key = `${si}-${qi}`;
        const answers = allAnswers.filter((a) => a.stageIndex === si && a.questionIndex === qi);
        const correct = answers.filter((a) => a.isCorrect).length;
        questionStats[key] = {
          correct,
          total: answers.length,
          stage: stage.title,
          topic: stage.mitrePhase,
        };
      });
    });

    // Find hardest and easiest questions
    const questionAccuracies = Object.entries(questionStats)
      .filter(([_, s]) => s.total > 0)
      .map(([key, s]) => ({
        key,
        accuracy: s.correct / s.total,
        topic: s.topic,
        stage: s.stage,
      }))
      .sort((a, b) => a.accuracy - b.accuracy);

    const hardest = questionAccuracies.slice(0, 3).map((q) => ({
      key: q.key,
      accuracy: Math.round(q.accuracy * 100),
      topic: q.topic,
      mitrePhase: q.topic,
    }));

    const easiest = questionAccuracies.slice(-3).map((q) => ({
      key: q.key,
      accuracy: Math.round(q.accuracy * 100),
      topic: q.topic,
      mitrePhase: q.topic,
    }));

    // Average score as percentage
    const totalPossible = scenario.totalPoints || 1;
    const avgScore = session.participants.length > 0
      ? session.participants.reduce((sum, p) => sum + p.totalScore, 0) / session.participants.length
      : 0;
    const avgScorePercent = (avgScore / totalPossible) * 100;

    // Average time per question
    const timesPerQuestion = allAnswers
      .filter((a) => a.timeToAnswer)
      .map((a) => (a.timeToAnswer || 0) / 1000);
    const avgTime = timesPerQuestion.length > 0
      ? timesPerQuestion.reduce((sum, t) => sum + t, 0) / timesPerQuestion.length
      : null;

    // Save feedback
    await db.scenarioFeedback.create({
      data: {
        orgId: session.orgId,
        sessionId: session.id,
        avgScorePercent,
        hardestQuestions: hardest,
        easiestQuestions: easiest,
        avgTimePerQuestion: avgTime,
        themesUsed: session.theme ? [session.theme] : [],
        mitreUsed: session.mitreAttackIds || [],
        difficultyUsed: session.difficulty,
      },
    });
  } catch (e) {
    console.error("Failed to save feedback:", e);
    // Non-critical — don't fail the completion
  }

  // Broadcast completion for group mode
  if (session.channelName) {
    try {
      await pusherServer.trigger(session.channelName, TTX_EVENTS.SESSION_COMPLETED, {
        sessionId,
        finalLeaderboard: session.participants.map((p, i) => ({
          userId: p.userId,
          firstName: p.user.firstName,
          lastName: p.user.lastName,
          totalScore: p.totalScore,
          rank: i + 1,
        })),
      });
    } catch (e) {
      console.error("Pusher error:", e);
    }
  }

  return NextResponse.json({ success: true });
}
