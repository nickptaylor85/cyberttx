export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

async function ensureTable() {
  await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS exercise_feedback (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, session_id TEXT NOT NULL, user_id TEXT NOT NULL, user_name TEXT, org_name TEXT, rating INT NOT NULL, comment TEXT, created_at TIMESTAMP DEFAULT NOW())`);
}

// POST — submit feedback
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureTable();
  const { sessionId, rating, comment } = await req.json();
  if (!sessionId || !rating) return NextResponse.json({ error: "sessionId and rating required" }, { status: 400 });

  const org = await db.organization.findUnique({ where: { id: user.orgId }, select: { name: true } });
  await db.$executeRawUnsafe(
    `INSERT INTO exercise_feedback (session_id, user_id, user_name, org_name, rating, comment) VALUES ($1, $2, $3, $4, $5, $6)`,
    sessionId, user.id, `${user.firstName || ""} ${user.lastName || ""}`.trim(), org?.name || "", rating, comment || ""
  );
  return NextResponse.json({ success: true });
}

// GET — list feedback (admin sees all, users see their own)
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureTable();

  const isAdmin = user.role === "SUPER_ADMIN";
  const feedback = isAdmin
    ? await db.$queryRawUnsafe(`SELECT * FROM exercise_feedback ORDER BY created_at DESC LIMIT 100`) as any[]
    : await db.$queryRawUnsafe(`SELECT * FROM exercise_feedback WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`, user.id) as any[];

  return NextResponse.json(feedback);
}
