import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  // Cascade delete
  const sessions = await db.ttxSession.findMany({ where: { orgId: id }, select: { id: true } });
  for (const s of sessions) {
    await db.ttxAnswer.deleteMany({ where: { participant: { sessionId: s.id } } });
    await db.ttxParticipant.deleteMany({ where: { sessionId: s.id } });
    await db.scenarioFeedback.deleteMany({ where: { sessionId: s.id } });
  }
  await db.ttxSession.deleteMany({ where: { orgId: id } });
  await db.user.deleteMany({ where: { orgId: id } });
  await db.orgSecurityTool.deleteMany({ where: { orgId: id } });
  await db.organization.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
