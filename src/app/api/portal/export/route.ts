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

  return NextResponse.json({ error: "Unknown export type" }, { status: 400 });
}
