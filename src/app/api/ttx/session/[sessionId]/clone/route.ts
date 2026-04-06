export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;
  const original = await db.ttxSession.findUnique({ where: { id: sessionId } });
  if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (original.orgId !== user.orgId && user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }
  if (!original.scenario) return NextResponse.json({ error: "No scenario to clone" }, { status: 400 });

  // Create a new session with the same scenario
  const newSession = await db.ttxSession.create({
    data: {
      orgId: original.orgId,
      title: original.title,
      difficulty: original.difficulty,
      theme: original.theme,
      mitreAttackIds: original.mitreAttackIds,
      mode: "INDIVIDUAL",
      status: "IN_PROGRESS",
      scenario: original.scenario,
      questionCount: original.questionCount,
      createdById: user.id,
    },
  });

  // Add the current user as participant
  await db.ttxParticipant.create({ data: { sessionId: newSession.id, userId: user.id } });

  return NextResponse.json({ id: newSession.id });
}
