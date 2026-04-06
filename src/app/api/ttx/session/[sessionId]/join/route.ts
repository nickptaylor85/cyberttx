export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { pusherServer, getTtxChannel, TTX_EVENTS } from "@/lib/pusher-server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;
  const session = await db.ttxSession.findUnique({ where: { id: sessionId } });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.orgId !== user.orgId && user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }
  if (session.status !== "LOBBY" && session.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "Exercise not joinable" }, { status: 400 });
  }

  // Add participant if not already in
  let participant = await db.ttxParticipant.findFirst({ where: { sessionId, userId: user.id } });
  if (!participant) {
    participant = await db.ttxParticipant.create({ data: { sessionId, userId: user.id } });
  }

  // Notify others via Pusher
  try {
    await pusherServer.trigger(getTtxChannel(sessionId), TTX_EVENTS.PLAYER_JOINED, {
      userId: user.id,
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      participantId: participant.id,
    });
  } catch {}

  return NextResponse.json({ success: true, participantId: participant.id });
}
