export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) return NextResponse.json({ error: "Both passwords required" }, { status: 400 });
  if (newPassword.length < 8) return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });

  // Verify current password
  if (!user.clerkId.startsWith("hash:")) return NextResponse.json({ error: "Cannot change password for this account type" }, { status: 400 });
  const currentHash = user.clerkId.slice(5);
  const valid = await bcrypt.compare(currentPassword, currentHash);
  if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

  const newHash = await bcrypt.hash(newPassword, 12);
  await db.user.update({ where: { id: user.id }, data: { clerkId: `hash:${newHash}` } });

  return NextResponse.json({ success: true });
}
