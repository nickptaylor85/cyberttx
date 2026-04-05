export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { email, token, password } = await req.json();
  if (!email || !token || !password) return NextResponse.json({ error: "All fields required" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

  const user = await db.user.findFirst({ where: { email: email.toLowerCase() } });
  if (!user?.firstName?.startsWith("rst:")) return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });

  const parts = user.firstName.split(":");
  const storedToken = parts[1];
  const expiry = new Date(parts[2]);
  const originalName = parts.slice(3).join(":") || null;

  if (storedToken !== token) return NextResponse.json({ error: "Invalid reset link" }, { status: 400 });
  if (expiry < new Date()) return NextResponse.json({ error: "Reset link has expired" }, { status: 400 });

  const hash = await bcrypt.hash(password, 12);
  await db.user.update({
    where: { id: user.id },
    data: { clerkId: `hash:${hash}`, firstName: originalName },
  });

  return NextResponse.json({ success: true });
}
