export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

async function ensureTable() {
  await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS announcements (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, title TEXT NOT NULL, message TEXT NOT NULL, type TEXT DEFAULT 'info', active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT NOW())`);
}

// GET — list announcements (public for portal, all for admin)
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureTable();

  const isAdmin = user.role === "SUPER_ADMIN";
  const items = isAdmin
    ? await db.$queryRawUnsafe(`SELECT * FROM announcements ORDER BY created_at DESC`) as any[]
    : await db.$queryRawUnsafe(`SELECT id, title, message, type, created_at FROM announcements WHERE active = true ORDER BY created_at DESC`) as any[];

  return NextResponse.json(items);
}

// POST — create announcement
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await ensureTable();
  const { title, message, type } = await req.json();
  if (!title || !message) return NextResponse.json({ error: "title and message required" }, { status: 400 });
  await db.$executeRawUnsafe(`INSERT INTO announcements (title, message, type) VALUES ($1, $2, $3)`, title, message, type || "info");
  return NextResponse.json({ success: true });
}

// PUT — toggle or update
export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await ensureTable();
  const { id, active } = await req.json();
  await db.$executeRawUnsafe(`UPDATE announcements SET active = $1 WHERE id = $2`, active, id);
  return NextResponse.json({ success: true });
}

// DELETE
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await ensureTable();
  const id = req.nextUrl.searchParams.get("id");
  if (id) await db.$executeRawUnsafe(`DELETE FROM announcements WHERE id = $1`, id);
  return NextResponse.json({ success: true });
}
