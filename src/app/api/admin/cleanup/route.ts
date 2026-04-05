export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cleanup-secret");
  if (secret !== "threatcast-cleanup-2026") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { slug } = await req.json();
  const org = await db.organization.findUnique({ where: { slug }, select: { id: true, name: true } });
  if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

  const sessions = await db.ttxSession.findMany({ where: { orgId: org.id }, select: { id: true } });
  for (const s of sessions) {
    await db.ttxAnswer.deleteMany({ where: { participant: { sessionId: s.id } } });
    await db.ttxParticipant.deleteMany({ where: { sessionId: s.id } });
    await db.scenarioFeedback.deleteMany({ where: { sessionId: s.id } });
  }
  await db.ttxSession.deleteMany({ where: { orgId: org.id } });
  await db.user.deleteMany({ where: { orgId: org.id } });
  await db.orgSecurityTool.deleteMany({ where: { orgId: org.id } });
  await db.organization.delete({ where: { id: org.id } });

  return NextResponse.json({ success: true, deleted: org.name });
}
