export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

async function ensureTable() {
  await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS scheduled_exercises (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    title TEXT NOT NULL,
    theme TEXT DEFAULT 'ransomware',
    difficulty TEXT DEFAULT 'INTERMEDIATE',
    scheduled_for TIMESTAMP NOT NULL,
    recurring TEXT DEFAULT 'none',
    active BOOLEAN DEFAULT true,
    last_run TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
  )`);
}

export async function GET() {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureTable();
  const items = await db.$queryRawUnsafe(`SELECT * FROM scheduled_exercises WHERE org_id = $1 AND active = true ORDER BY scheduled_for ASC`, user.orgId) as any[];
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureTable();
  const { title, theme, difficulty, scheduledFor, recurring } = await req.json();
  if (!title || !scheduledFor) return NextResponse.json({ error: "Title and date required" }, { status: 400 });
  await db.$executeRawUnsafe(
    `INSERT INTO scheduled_exercises (org_id, created_by, title, theme, difficulty, scheduled_for, recurring) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    user.orgId, user.id, title, theme || "ransomware", difficulty || "INTERMEDIATE", new Date(scheduledFor), recurring || "none"
  );
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await db.$executeRawUnsafe(`UPDATE scheduled_exercises SET active = false WHERE id = $1 AND org_id = $2`, id, user.orgId);
  return NextResponse.json({ success: true });
}
