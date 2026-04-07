export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

async function ensureTable() {
  await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS password_resets (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, email TEXT NOT NULL, token TEXT NOT NULL, used BOOLEAN DEFAULT false, expires_at TIMESTAMP NOT NULL, created_at TIMESTAMP DEFAULT NOW())`);
}

// POST — request password reset
export async function POST(req: NextRequest) {
  const { email } = await req.json();
  const rl = rateLimit(`reset:${email}`, 3, 60 * 60 * 1000); // 3 per hour
  if (!rl.allowed) return NextResponse.json({ error: "Too many reset attempts. Try again later." }, { status: 429 });
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
  await ensureTable();

  const user = await db.user.findFirst({ where: { email: email.toLowerCase() } });
  // Always return success (don't reveal if email exists)
  if (!user) return NextResponse.json({ success: true });

  const token = Array.from({ length: 48 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.$executeRawUnsafe(`INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)`, email.toLowerCase(), token, expiresAt);

  const resetUrl = `https://threatcast.io/reset-password?token=${token}&email=${encodeURIComponent(email.toLowerCase())}`;

  if (process.env.RESEND_API_KEY) {
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "ThreatCast <onboarding@resend.dev>", to: [email.toLowerCase()],
        subject: "Reset your ThreatCast password",
        html: `<div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto;padding:40px 20px;"><div style="font-size:20px;font-weight:700;margin-bottom:24px;">Threat<span style="color:#14b89a;">Cast</span></div><h2>Reset your password</h2><p>Click below to set a new password. This link expires in 1 hour.</p><a href="${resetUrl}" style="display:inline-block;background:#14b89a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Reset Password</a><p style="color:#888;font-size:12px;margin-top:24px;">If you didn't request this, you can safely ignore this email.</p></div>`,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}

// PUT — set new password
export async function PUT(req: NextRequest) {
  const { token, email, password } = await req.json();
  if (!token || !email || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  await ensureTable();

  const rows = await db.$queryRawUnsafe(`SELECT id FROM password_resets WHERE email = $1 AND token = $2 AND used = false AND expires_at > NOW()`, email.toLowerCase(), token) as any[];
  if (rows.length === 0) return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });

  const hash = await bcrypt.hash(password, 12);
  await db.user.updateMany({ where: { email: email.toLowerCase(), clerkId: { startsWith: "hash:" } }, data: { clerkId: `hash:${hash}` } });
  await db.$executeRawUnsafe(`UPDATE password_resets SET used = true WHERE token = $1`, token);

  return NextResponse.json({ success: true });
}
