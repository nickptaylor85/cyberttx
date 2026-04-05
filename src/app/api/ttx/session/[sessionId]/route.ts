export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;
  const session = await db.ttxSession.findUnique({
    where: { id: sessionId },
    include: {
      participants: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true } }, // No avatarUrl, no clerkId
          answers: true,
        },
        orderBy: { totalScore: "desc" },
      },
    },
  });

  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // TENANT ISOLATION: verify user belongs to same org
  if (user.role !== "SUPER_ADMIN" && session.orgId !== user.orgId) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  return NextResponse.json(session);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;
  const session = await db.ttxSession.findUnique({
    where: { id: sessionId },
    select: { id: true, orgId: true },
  });

  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // TENANT ISOLATION: only same-org or super admin can delete
  if (user.role !== "SUPER_ADMIN" && session.orgId !== user.orgId) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  await db.ttxAnswer.deleteMany({ where: { participant: { sessionId } } });
  await db.ttxParticipant.deleteMany({ where: { sessionId } });
  await db.scenarioFeedback.deleteMany({ where: { sessionId } });
  await db.ttxSession.delete({ where: { id: sessionId } });

  return NextResponse.json({ success: true });
}
