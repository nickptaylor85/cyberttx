export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

// PUT — change user role (CLIENT_ADMIN only)
export async function PUT(req: NextRequest) {
  const admin = await getAuthUser();
  if (!admin?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "CLIENT_ADMIN" && admin.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only portal admins can manage roles" }, { status: 403 });
  }

  const { userId, role } = await req.json();
  if (!userId || !role) return NextResponse.json({ error: "userId and role required" }, { status: 400 });
  if (!["CLIENT_ADMIN", "MEMBER"].includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  // Verify target user is in same org
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target || (target.orgId !== admin.orgId && admin.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (target.role === "SUPER_ADMIN") return NextResponse.json({ error: "Cannot change platform admin role" }, { status: 403 });

  // Prevent demoting yourself if you're the only admin
  if (target.id === admin.id && role === "MEMBER") {
    const otherAdmins = await db.user.count({ where: { orgId: admin.orgId, role: "CLIENT_ADMIN", id: { not: admin.id } } });
    if (otherAdmins === 0) return NextResponse.json({ error: "Cannot demote yourself — you're the only portal admin" }, { status: 400 });
  }

  await db.user.update({ where: { id: userId }, data: { role } });
  return NextResponse.json({ success: true });
}

// DELETE — remove user from org (CLIENT_ADMIN only)
export async function DELETE(req: NextRequest) {
  const admin = await getAuthUser();
  if (!admin?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "CLIENT_ADMIN" && admin.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only portal admins can remove users" }, { status: 403 });
  }

  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  if (userId === admin.id) return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target || (target.orgId !== admin.orgId && admin.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await db.user.update({ where: { id: userId }, data: { orgId: null, role: "MEMBER" } });
  return NextResponse.json({ success: true });
}
