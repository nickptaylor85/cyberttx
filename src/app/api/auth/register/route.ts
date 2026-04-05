import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { findOrgForEmail } from "@/lib/org-matching";

export async function POST(req: NextRequest) {
  const { email, password, firstName, lastName } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const emailLower = email.toLowerCase();
  const hash = await bcrypt.hash(password, 12);

  // Check if user already exists
  const existing = await db.user.findFirst({ where: { email: emailLower } });

  if (existing) {
    // If they already have a password (hash:), they're already registered
    if (existing.clerkId.startsWith("hash:")) {
      return NextResponse.json({ error: "Email already registered. Please sign in." }, { status: 409 });
    }

    // Existing Clerk user or pending invitation — migrate them to password auth
    await db.user.update({
      where: { id: existing.id },
      data: {
        clerkId: `hash:${hash}`,
        firstName: firstName || existing.firstName,
        lastName: lastName || existing.lastName,
      },
    });

    return NextResponse.json({ success: true, userId: existing.id, migrated: true }, { status: 201 });
  }

  // Brand new user
  let orgId = await findOrgForEmail(emailLower);

  // Clean up pending invitation
  if (orgId) {
    const pending = await db.user.findFirst({
      where: { email: emailLower, clerkId: { startsWith: "pending_" } },
    });
    if (pending) await db.user.delete({ where: { id: pending.id } });
  }

  // Fall back to demo org
  if (!orgId) {
    const demo = await db.organization.findUnique({ where: { slug: "demo" } });
    if (demo) orgId = demo.id;
  }

  // Check if should be SUPER_ADMIN
  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  const existingSuperAdmins = await db.user.count({ where: { role: "SUPER_ADMIN" } });
  const isSuperAdmin = superAdminEmails.includes(emailLower) || existingSuperAdmins === 0;

  const user = await db.user.create({
    data: {
      clerkId: `hash:${hash}`,
      email: emailLower,
      firstName: firstName || null,
      lastName: lastName || null,
      role: isSuperAdmin ? "SUPER_ADMIN" : orgId ? "CLIENT_ADMIN" : "MEMBER",
      orgId,
    },
  });

  return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
}
