export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const user = await db.user.findFirst({ where: { email: email.toLowerCase() } });
  // Always return success to prevent email enumeration
  if (!user) return NextResponse.json({ success: true });

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Store token in user's firstName field temporarily (prefix: "rst:")
  // In production, use a dedicated ResetToken table
  const existingFirst = user.firstName?.startsWith("rst:") ? null : user.firstName;
  await db.user.update({
    where: { id: user.id },
    data: { firstName: `rst:${token}:${expiry.toISOString()}:${existingFirst || ""}` },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL || "https://threatcast.io"}/reset-password?token=${token}&email=${encodeURIComponent(email.toLowerCase())}`;

  // Send email via Resend if configured
  if (process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "ThreatCast <onboarding@resend.dev>",
        to: [email.toLowerCase()],
        subject: "Reset your ThreatCast password",
        html: `<div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto;padding:40px 20px;">
          <div style="font-size:20px;font-weight:700;margin-bottom:24px;">Threat<span style="color:#14b89a;">Cast</span></div>
          <h2 style="font-size:18px;">Reset your password</h2>
          <p style="color:#666;">Click the button below to set a new password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#14b89a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">Reset Password →</a>
          <p style="color:#999;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
        </div>`,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
