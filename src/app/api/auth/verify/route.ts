export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const email = req.nextUrl.searchParams.get("email");
  if (!token || !email) return NextResponse.redirect(new URL("/sign-in?error=invalid-verification", req.url));

  try {
    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS email_verifications (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, email TEXT NOT NULL, token TEXT NOT NULL, verified BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW())`);
    const rows = await db.$queryRawUnsafe(`SELECT id FROM email_verifications WHERE email = $1 AND token = $2 AND verified = false`, email.toLowerCase(), token) as any[];
    if (rows.length === 0) return NextResponse.redirect(new URL("/sign-in?error=invalid-token", req.url));

    await db.$executeRawUnsafe(`UPDATE email_verifications SET verified = true WHERE email = $1 AND token = $2`, email.toLowerCase(), token);
    // Mark user as verified (using isActive flag)
    await db.user.updateMany({ where: { email: email.toLowerCase() }, data: { isActive: true } });

    return NextResponse.redirect(new URL("/sign-in?verified=1", req.url));
  } catch {
    return NextResponse.redirect(new URL("/sign-in?error=verification-failed", req.url));
  }
}
