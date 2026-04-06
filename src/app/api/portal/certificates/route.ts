export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS user_certificates (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL, session_id TEXT NOT NULL,
        title TEXT, grade TEXT, accuracy INT, theme TEXT, org_name TEXT,
        earned_at TIMESTAMP DEFAULT NOW(), expires_at TIMESTAMP
      )
    `);
    const certs = await db.$queryRawUnsafe(
      `SELECT id, session_id, title, grade, accuracy, theme, org_name, earned_at, expires_at FROM user_certificates WHERE user_id = $1 ORDER BY earned_at DESC`,
      user.id
    ) as any[];
    return NextResponse.json(certs);
  } catch {
    return NextResponse.json([]);
  }
}
