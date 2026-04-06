import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import type { TtxScenario } from "@/types";
import { pusherServer, getTtxChannel, TTX_EVENTS } from "@/lib/pusher-server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;
  const body = await req.json();
  const { stageIndex, questionIndex, selectedOption } = body;

  const session = await db.ttxSession.findUnique({
    where: { id: sessionId },
    include: { participants: true },
  });

  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // TENANT ISOLATION
  if (user.role !== "SUPER_ADMIN" && session.orgId !== user.orgId) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Find or create participant
  let participant = session.participants.find((p) => p.userId === user.id);
  if (!participant) {
    participant = await db.ttxParticipant.create({
      data: { sessionId, userId: user.id },
    });
  }

  // Validate question exists
  const scenario = session.scenario as unknown as TtxScenario;
  const stage = scenario.stages[stageIndex];
  const question = stage?.questions[questionIndex];
  if (!question) return NextResponse.json({ error: "Invalid question" }, { status: 400 });

  const isCorrect = question.options[selectedOption]?.isCorrect || false;
  const points = isCorrect ? (question.options.find((o) => o.isCorrect)?.points || 0) : 0;

  await db.ttxAnswer.upsert({
    where: {
      participantId_stageIndex_questionIndex: {
        participantId: participant.id, stageIndex, questionIndex,
      },
    },
    create: { participantId: participant.id, stageIndex, questionIndex, selectedOption, isCorrect, points },
    update: { selectedOption, isCorrect, points },
  });

  // Recalculate total
  const allAnswers = await db.ttxAnswer.findMany({ where: { participantId: participant.id } });
  const totalScore = allAnswers.reduce((sum, a) => sum + a.points, 0);
  await db.ttxParticipant.update({ where: { id: participant.id }, data: { totalScore } });


  // Notify team via Pusher (group mode)
  try {
    if (session.mode === "GROUP" && session.channelName) {
      await pusherServer.trigger(getTtxChannel(sessionId), TTX_EVENTS.PLAYER_ANSWERED, {
        userId: user.id,
        stageIndex,
        questionIndex,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      });
    }
  } catch {}

  return NextResponse.json({ isCorrect, points, totalScore });
}
