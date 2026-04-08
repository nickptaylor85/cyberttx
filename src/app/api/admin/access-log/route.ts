export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS admin_access_log (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id TEXT, email TEXT, ip TEXT, path TEXT, created_at TIMESTAMP DEFAULT NOW())`);
    const logs = await db.$queryRawUnsafe(`SELECT * FROM admin_access_log ORDER BY created_at DESC LIMIT 50`) as any[];
    return NextResponse.json(logs);
  } catch {
    return NextResponse.json([]);
  }
}
