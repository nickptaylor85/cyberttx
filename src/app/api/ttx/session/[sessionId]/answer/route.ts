import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { pusherServer, getTtxChannel, TTX_EVENTS } from "@/lib/pusher-server";
import type { TtxScenario } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const body = await req.json();
  const { stageIndex, questionIndex, selectedOption } = body;

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get session and verify access
  const session = await db.ttxSession.findUnique({
    where: { id: sessionId },
    include: { participants: { include: { user: true } } },
  });

  if (!session || session.orgId !== user.orgId) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Find participant
  let participant = session.participants.find((p) => p.userId === user.id);
  if (!participant) {
    // Auto-join if not yet participating
    participant = await db.ttxParticipant.create({
      data: { sessionId, userId: user.id },
      include: { user: true },
    }) as any;
  }

  // Get the question from scenario
  const scenario = session.scenario as unknown as TtxScenario;
  const stage = scenario.stages[stageIndex];
  const question = stage?.questions[questionIndex];

  if (!question) {
    return NextResponse.json({ error: "Invalid question" }, { status: 400 });
  }

  const isCorrect = question.options[selectedOption]?.isCorrect || false;
  const points = isCorrect ? (question.options.find((o) => o.isCorrect)?.points || 0) : 0;

  // Save answer
  const answer = await db.ttxAnswer.upsert({
    where: {
      participantId_stageIndex_questionIndex: {
        participantId: participant!.id,
        stageIndex,
        questionIndex,
      },
    },
    create: {
      participantId: participant!.id,
      stageIndex,
      questionIndex,
      selectedOption,
      isCorrect,
      points,
    },
    update: {
      selectedOption,
      isCorrect,
      points,
    },
  });

  // Update participant total score
  const allAnswers = await db.ttxAnswer.findMany({
    where: { participantId: participant!.id },
  });
  const totalScore = allAnswers.reduce((sum, a) => sum + a.points, 0);

  await db.ttxParticipant.update({
    where: { id: participant!.id },
    data: { totalScore },
  });

  // Broadcast to channel for group mode
  if (session.mode === "GROUP" && session.channelName) {
    try {
      // Broadcast player answered
      await pusherServer.trigger(session.channelName, TTX_EVENTS.PLAYER_ANSWERED, {
        userId: user.id,
        stageIndex,
        questionIndex,
        isCorrect,
        points,
        totalScore,
      });

      // Broadcast updated leaderboard
      const updatedParticipants = await db.ttxParticipant.findMany({
        where: { sessionId },
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: { totalScore: "desc" },
      });

      await pusherServer.trigger(session.channelName, TTX_EVENTS.SCORE_UPDATE, {
        leaderboard: updatedParticipants.map((p, i) => ({
          userId: p.userId,
          firstName: p.user.firstName,
          lastName: p.user.lastName,
          totalScore: p.totalScore,
          rank: i + 1,
        })),
      });
    } catch (e) {
      console.error("Pusher broadcast error:", e);
    }
  }

  return NextResponse.json({ isCorrect, points, totalScore });
}
