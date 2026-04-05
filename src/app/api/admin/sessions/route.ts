export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";


// DELETE /api/admin/sessions?id=xxx or ?status=CANCELLED (bulk)
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  const status = req.nextUrl.searchParams.get("status");

  if (id) {
    // Delete single session and related data
    await db.ttxAnswer.deleteMany({ where: { participant: { sessionId: id } } });
    await db.ttxParticipant.deleteMany({ where: { sessionId: id } });
    await db.scenarioFeedback.deleteMany({ where: { sessionId: id } });
    await (db.playbook.deleteMany as any)({ where: { sessionId: id } });
    await db.ttxSession.delete({ where: { id } });
    return NextResponse.json({ success: true, deleted: 1 });
  }

  if (status) {
    // Bulk delete by status (e.g. CANCELLED, GENERATING)
    const sessions = await db.ttxSession.findMany({ where: { status: status as any }, select: { id: true } });
    for (const s of sessions) {
      await db.ttxAnswer.deleteMany({ where: { participant: { sessionId: s.id } } });
      await db.ttxParticipant.deleteMany({ where: { sessionId: s.id } });
      await db.scenarioFeedback.deleteMany({ where: { sessionId: s.id } });
      await (db.playbook.deleteMany as any)({ where: { sessionId: s.id } });
    }
    const result = await db.ttxSession.deleteMany({ where: { status: status as any } });
    return NextResponse.json({ success: true, deleted: result.count });
  }

  return NextResponse.json({ error: "Provide id or status param" }, { status: 400 });
}
