export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

async function ensureTable() {
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS saved_playbooks (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        org_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        theme TEXT,
        playbook_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  } catch {}
}

// GET — list saved playbooks for this org
export async function GET() {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureTable();

  const playbooks = await db.$queryRawUnsafe(
    `SELECT id, session_id, title, theme, created_at FROM saved_playbooks WHERE org_id = $1 ORDER BY created_at DESC`,
    user.orgId
  ) as any[];

  return NextResponse.json(playbooks);
}

// POST — save a playbook
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureTable();

  const { sessionId, title, theme, playbook } = await req.json();
  if (!sessionId || !playbook) return NextResponse.json({ error: "sessionId and playbook required" }, { status: 400 });

  // Check if already saved for this session
  const existing = await db.$queryRawUnsafe(
    `SELECT id FROM saved_playbooks WHERE session_id = $1 AND org_id = $2`,
    sessionId, user.orgId
  ) as any[];

  if (existing.length > 0) {
    return NextResponse.json({ id: existing[0].id, alreadySaved: true });
  }

  const result = await db.$queryRawUnsafe(
    `INSERT INTO saved_playbooks (org_id, session_id, user_id, title, theme, playbook_json) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    user.orgId, sessionId, user.id, title || "Untitled Playbook", theme || "", JSON.stringify(playbook)
  ) as any[];

  return NextResponse.json({ id: result[0]?.id, saved: true });
}

// DELETE — remove a playbook
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureTable();

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db.$executeRawUnsafe(`DELETE FROM saved_playbooks WHERE id = $1 AND org_id = $2`, id, user.orgId);
  return NextResponse.json({ success: true });
}
