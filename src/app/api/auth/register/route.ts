import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { checkUserLimit } from "@/lib/plan-limits";
import { findOrgForEmail } from "@/lib/org-matching";

export async function POST(req: NextRequest) {
  // Rate limit registration
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rl = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000); // 5 per hour per IP
  if (!rl.allowed) return NextResponse.json({ error: "Too many registration attempts. Try again later." }, { status: 429 });

  // Read body once
  const { email, password, firstName, lastName } = await req.json();

  // Check if sign-ups are enabled
  try {
    const platformOrg = await db.organization.findUnique({ where: { slug: "__platform__" } });
    if (platformOrg) {
      const profile = await db.orgProfile.findUnique({ where: { orgId: platformOrg.id }, select: { additionalContext: true } });
      const match = (profile?.additionalContext || "").match(/SETTINGS:({[^}]*})/);
      if (match) {
        const settings = JSON.parse(match[1]);
        if (settings.signupsDisabled) {
          // Still allow invited users (they have a pending record)
          const pending = await db.user.findFirst({ where: { email: email?.toLowerCase(), clerkId: { startsWith: "pending_" } } });
          if (!pending) {
            return NextResponse.json({ error: "New sign-ups are currently disabled. Contact your administrator for an invitation." }, { status: 403 });
          }
        }
      }
    }
  } catch {}

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const emailLower = email.toLowerCase();
  // Check user limit for the org
  const emailLowerCheck = email.toLowerCase();
  const orgIdForCheck = await findOrgForEmail(emailLowerCheck);
  if (orgIdForCheck) {
    const userLimit = await checkUserLimit(orgIdForCheck);
    if (!userLimit.allowed) {
      return NextResponse.json({ error: `This portal has reached its user limit (${userLimit.current}/${userLimit.limit}). Contact your admin to upgrade.` }, { status: 403 });
    }
  }

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

    // Send verification email
  if (process.env.RESEND_API_KEY) {
    try {
      const verifyToken = Array.from({ length: 32 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");
      await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS email_verifications (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, email TEXT NOT NULL, token TEXT NOT NULL, verified BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW())`);
      await db.$executeRawUnsafe(`INSERT INTO email_verifications (email, token) VALUES ($1, $2)`, emailLower, verifyToken);
      const verifyUrl = `https://threatcast.io/api/auth/verify?token=${verifyToken}&email=${encodeURIComponent(emailLower)}`;
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "ThreatCast <noreply@threatcast.io>", to: [emailLower],
          subject: "Verify your ThreatCast email",
          html: `<div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto;padding:40px 20px;"><h2>Verify your email</h2><p>Click below to verify your email address:</p><a href="${verifyUrl}" style="display:inline-block;background:#14b89a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Verify Email</a></div>`,
        }),
      }).catch(() => {});
    } catch {}
  }

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
      role: isSuperAdmin ? "SUPER_ADMIN" : "MEMBER", // Role upgraded to CLIENT_ADMIN on first portal access if no admin exists
      orgId,
    },
  });

  // Send welcome/onboarding email
  if (process.env.RESEND_API_KEY) {
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "ThreatCast <noreply@threatcast.io>",
        to: [emailLower],
        subject: "Welcome to ThreatCast — Let's get started",
        html: `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
          <div style="font-size:20px;font-weight:700;margin-bottom:24px;">Threat<span style="color:#14b89a;">Cast</span></div>
          <h1 style="font-size:22px;margin-bottom:16px;">Welcome, ${firstName || "there"}!</h1>
          <p style="color:#333;line-height:1.6;">Your account is ready. Here's how to get the most out of ThreatCast:</p>
          <div style="margin:24px 0;">
            <p style="margin:8px 0;"><strong>Step 1:</strong> Set up your <a href="https://threatcast.io/portal/profile" style="color:#14b89a;">company profile</a></p>
            <p style="margin:8px 0;"><strong>Step 2:</strong> Configure your <a href="https://threatcast.io/portal/tools" style="color:#14b89a;">security stack</a></p>
            <p style="margin:8px 0;"><strong>Step 3:</strong> Run your <a href="https://threatcast.io/portal/ttx/new" style="color:#14b89a;">first exercise</a></p>
          </div>
          <a href="https://threatcast.io/portal" style="display:inline-block;background:#14b89a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Go to Dashboard →</a>
          <p style="color:#999;font-size:12px;margin-top:24px;">Questions? Reply to this email or visit our <a href="https://threatcast.io/portal/guide" style="color:#14b89a;">User Guide</a>.</p>
        </div>`,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
}
