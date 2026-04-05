export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as OTPAuth from "otpauth";
import bcrypt from "bcryptjs";

// POST — verify MFA during sign-in (before session is created)
export async function POST(req: NextRequest) {
  const { email, password, code } = await req.json();
  if (!email || !password || !code) {
    return NextResponse.json({ error: "Email, password, and MFA code required" }, { status: 400 });
  }

  const user = await db.user.findFirst({
    where: { email: email.toLowerCase(), clerkId: { startsWith: "hash:" } },
  });
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  // Verify password
  const hash = user.clerkId.slice(5);
  const validPass = await bcrypt.compare(password, hash);
  if (!validPass) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  // Check MFA
  if (!user.avatarUrl?.startsWith("mfa:")) {
    return NextResponse.json({ error: "MFA not enabled for this account" }, { status: 400 });
  }

  const secret = user.avatarUrl.split("|")[0].slice(4);
  const totp = new OTPAuth.TOTP({
    issuer: "ThreatCast",
    label: user.email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  const delta = totp.validate({ token: code, window: 1 });
  if (delta === null) {
    return NextResponse.json({ error: "Invalid MFA code" }, { status: 400 });
  }

  return NextResponse.json({ success: true, mfaVerified: true });
}
