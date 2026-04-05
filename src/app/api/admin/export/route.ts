export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const type = req.nextUrl.searchParams.get("type");
  let csv = "";

  if (type === "clients") {
    const orgs = await db.organization.findMany({ include: { _count: { select: { users: true, ttxSessions: true } } } });
    csv = "Name,Slug,Plan,Users,Sessions,Created\n" + orgs.map(o => `"${o.name}",${o.slug},${o.plan},${o._count.users},${o._count.ttxSessions},${o.createdAt.toISOString()}`).join("\n");
  } else if (type === "users") {
    const users = await db.user.findMany({ include: { organization: { select: { name: true } }, _count: { select: { participations: true } } } });
    csv = "Name,Email,Role,Organization,Exercises,Created\n" + users.map(u => `"${u.firstName || ''} ${u.lastName || ''}",${u.email},${u.role},"${u.organization?.name || ''}",${u._count.participations},${u.createdAt.toISOString()}`).join("\n");
  } else if (type === "sessions") {
    const sessions = await db.ttxSession.findMany({ include: { organization: { select: { name: true } }, _count: { select: { participants: true } } } });
    csv = "Title,Theme,Difficulty,Status,Organization,Participants,Created,Completed\n" + sessions.map(s => `"${(s.title || '').replace(/"/g, '""')}",${s.theme},${s.difficulty},${s.status},"${s.organization?.name || ''}",${s._count.participants},${s.createdAt.toISOString()},${s.completedAt?.toISOString() || ''}`).join("\n");
  } else if (type === "compliance") {
    const sessions = await db.ttxSession.findMany({ where: { status: "COMPLETED" }, include: { organization: { select: { name: true } } } });
    csv = "Organization,Exercise,Theme,Date,ISO27001,NIST_CSF,SOC2,NIS2,DORA\n" + sessions.map(s => `"${s.organization?.name || ''}","${(s.title || '').replace(/"/g, '""')}",${s.theme},${s.completedAt?.toISOString() || s.createdAt.toISOString()},Evidenced,Evidenced,Evidenced,Evidenced,Evidenced`).join("\n");
  } else {
    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  }

  return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename=threatcast-${type}.csv` } });
}
