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
  if (session.createdById !== user.id && user.role !== "SUPER_ADMIN" && user.role !== "CLIENT_ADMIN") {
    return NextResponse.json({ error: "Only the exercise creator or admin can start" }, { status: 403 });
  }
  if (session.status !== "LOBBY") {
    return NextResponse.json({ error: "Exercise not in lobby" }, { status: 400 });
  }

  await db.ttxSession.update({ where: { id: sessionId }, data: { status: "IN_PROGRESS" } });

  // Notify all players
  try {
    await pusherServer.trigger(getTtxChannel(sessionId), TTX_EVENTS.SESSION_STARTING, {
      startedBy: user.id,
    });
  } catch {}

  return NextResponse.json({ success: true });
}
