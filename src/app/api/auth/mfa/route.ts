export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

function getMfaSecret(user: any): string | null {
  if (!user.avatarUrl?.startsWith("mfa:")) return null;
  return user.avatarUrl.split("|")[0].slice(4); // Remove "mfa:" prefix
}

function setMfaSecret(currentAvatar: string | null, secret: string | null): string | null {
  if (!secret) {
    // Disable MFA — restore original avatar if any
    if (currentAvatar?.startsWith("mfa:")) {
      const parts = currentAvatar.split("|");
      return parts[1] || null; // Return original avatar URL or null
    }
    return currentAvatar;
  }
  // Enable MFA — preserve original avatar
  const originalAvatar = currentAvatar?.startsWith("mfa:") 
    ? currentAvatar.split("|")[1] || ""
    : currentAvatar || "";
  return originalAvatar ? `mfa:${secret}|${originalAvatar}` : `mfa:${secret}`;
}

// GET — check MFA status + generate setup QR if not enabled
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existingSecret = getMfaSecret(user);
  if (existingSecret) {
    return NextResponse.json({ enabled: true });
  }

  // Generate new TOTP secret for setup
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: "ThreatCast",
    label: user.email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });

  const uri = totp.toString();
  const qrCode = await QRCode.toDataURL(uri);

  return NextResponse.json({
    enabled: false,
    secret: secret.base32,
    qrCode,
    uri,
  });
}

// POST — verify TOTP code and enable MFA
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, secret } = await req.json();
  if (!code || !secret) return NextResponse.json({ error: "Code and secret required" }, { status: 400 });

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
    return NextResponse.json({ error: "Invalid code. Please try again." }, { status: 400 });
  }

  // Enable MFA — store secret
  await db.user.update({
    where: { id: user.id },
    data: { avatarUrl: setMfaSecret(user.avatarUrl, secret) },
  });

  return NextResponse.json({ success: true, enabled: true });
}

// DELETE — disable MFA
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json();
  const existingSecret = getMfaSecret(user);
  if (!existingSecret) return NextResponse.json({ error: "MFA not enabled" }, { status: 400 });

  // Verify code before disabling
  const totp = new OTPAuth.TOTP({
    issuer: "ThreatCast",
    label: user.email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(existingSecret),
  });

  const delta = totp.validate({ token: code, window: 1 });
  if (delta === null) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  await db.user.update({
    where: { id: user.id },
    data: { avatarUrl: setMfaSecret(user.avatarUrl, null) },
  });

  return NextResponse.json({ success: true, enabled: false });
}
