export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// DELETE — delete a user entirely
export async function DELETE(req: NextRequest) {
  const admin = await getAuthUser();
  if (!admin || admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  if (userId === admin.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

  // Cascade delete user data
  const participations = await db.ttxParticipant.findMany({ where: { userId }, select: { id: true } });
  for (const p of participations) {
    await db.ttxAnswer.deleteMany({ where: { participantId: p.id } });
  }
  await db.ttxParticipant.deleteMany({ where: { userId } });
  await db.user.delete({ where: { id: userId } });

  return NextResponse.json({ success: true });
}

// PUT — update user (reset password, change role, change org, toggle active)
export async function PUT(req: NextRequest) {
  const admin = await getAuthUser();
  if (!admin || admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, action, value } = await req.json();
  if (!userId || !action) return NextResponse.json({ error: "userId and action required" }, { status: 400 });

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  switch (action) {
    case "reset_password": {
      const tempPassword = value || "ThreatCast2026!";
      const hash = await bcrypt.hash(tempPassword, 12);
      await db.user.update({ where: { id: userId }, data: { clerkId: `hash:${hash}` } });
      return NextResponse.json({ success: true, tempPassword });
    }
    case "change_role": {
      if (!["SUPER_ADMIN", "CLIENT_ADMIN", "MEMBER"].includes(value)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      await db.user.update({ where: { id: userId }, data: { role: value } });
      return NextResponse.json({ success: true });
    }
    case "change_org": {
      await db.user.update({ where: { id: userId }, data: { orgId: value || null } });
      return NextResponse.json({ success: true });
    }
    case "toggle_active": {
      await db.user.update({ where: { id: userId }, data: { isActive: !target.isActive } });
      return NextResponse.json({ success: true, isActive: !target.isActive });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
