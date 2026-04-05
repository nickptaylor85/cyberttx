export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const type = req.nextUrl.searchParams.get("type");
  let csv = "";

  if (type === "exercises") {
    const sessions = await db.ttxSession.findMany({ where: { orgId: user.orgId }, include: { _count: { select: { participants: true } } } });
    csv = "Title,Theme,Difficulty,Status,Participants,Created,Completed\n" + sessions.map(s => `"${(s.title || '').replace(/"/g, '""')}",${s.theme},${s.difficulty},${s.status},${s._count.participants},${s.createdAt.toISOString()},${s.completedAt?.toISOString() || ''}`).join("\n");
  } else if (type === "team") {
    const users = await db.user.findMany({ where: { orgId: user.orgId }, include: { _count: { select: { participations: true } } } });
    csv = "Name,Email,Role,Exercises\n" + users.map(u => `"${u.firstName || ''} ${u.lastName || ''}",${u.email},${u.role},${u._count.participations}`).join("\n");
  } else if (type === "compliance" || type === "all") {
    const sessions = await db.ttxSession.findMany({ where: { orgId: user.orgId, status: "COMPLETED" } });
    csv = "Exercise,Theme,Date,ISO27001,NIST_CSF,SOC2,NIS2,DORA\n" + sessions.map(s => `"${(s.title || '').replace(/"/g, '""')}",${s.theme},${s.completedAt?.toISOString() || ''},Yes,Yes,Yes,Yes,Yes`).join("\n");
  } else {
    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  }

  return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename=threatcast-${type}.csv` } });
}
