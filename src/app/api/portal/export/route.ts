export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const type = req.nextUrl.searchParams.get("type");

  if (type === "exercises") {
    const sessions = await db.ttxSession.findMany({
      where: { orgId: user.orgId, status: "COMPLETED" },
      select: { id: true, title: true, theme: true, difficulty: true, createdAt: true, completedAt: true },
      orderBy: { createdAt: "desc" },
    });
    const csv = "ID,Title,Theme,Difficulty,Created,Completed\n" + sessions.map(s => `"${s.id}","${s.title}","${s.theme}","${s.difficulty}","${s.createdAt?.toISOString()}","${s.completedAt?.toISOString() || ""}"`).join("\n");
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=exercises.csv" } });
  }

  if (type === "users") {
    const users = await db.user.findMany({ where: { orgId: user.orgId }, select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true } });
    const csv = "ID,Email,First Name,Last Name,Role,Created\n" + users.map(u => `"${u.id}","${u.email}","${u.firstName || ""}","${u.lastName || ""}","${u.role}","${u.createdAt?.toISOString()}"`).join("\n");
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=users.csv" } });
  }

  if (type === "playbooks") {
    try {
      const playbooks = await db.$queryRawUnsafe(
        `SELECT id, title, theme, created_at FROM saved_playbooks WHERE org_id = $1 ORDER BY created_at DESC`, user.orgId
      ) as any[];
      const csv = "ID,Title,Theme,Saved\n" + playbooks.map((p: any) => `"${p.id}","${(p.title || "").replace(/"/g, '""')}","${p.theme || ""}","${p.created_at}"`).join("\n");
      return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=playbooks.csv" } });
    } catch {
      return new NextResponse("ID,Title,Theme,Saved\n", { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=playbooks.csv" } });
    }
  }

  if (type === "certificates") {
    try {
      const certs = await db.$queryRawUnsafe(
        `SELECT id, title, grade, accuracy, created_at, expires_at FROM user_certificates WHERE org_id = $1 ORDER BY created_at DESC`, user.orgId
      ) as any[];
      const csv = "ID,Title,Grade,Accuracy,Issued,Expires\n" + certs.map((c: any) => `"${c.id}","${(c.title || "").replace(/"/g, '""')}","${c.grade || ""}",${c.accuracy || 0},"${c.created_at}","${c.expires_at || ""}"`).join("\n");
      return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=certificates.csv" } });
    } catch {
      return new NextResponse("ID,Title,Grade,Accuracy,Issued,Expires\n", { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=certificates.csv" } });
    }
  }

  return NextResponse.json({ error: "Unknown export type" }, { status: 400 });
}
