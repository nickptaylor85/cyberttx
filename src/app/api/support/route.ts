export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

// Ensure support_tickets table exists (runs once)
async function ensureTable() {
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT,
        user_email TEXT NOT NULL,
        user_name TEXT,
        org_id TEXT,
        org_name TEXT,
        message TEXT NOT NULL,
        admin_reply TEXT,
        replied_at TIMESTAMP,
        status TEXT DEFAULT 'open',
        created_at TIMESTAMP DEFAULT NOW(),
        resolved_at TIMESTAMP
      )
    `);
  } catch {}
}

// POST — create ticket (from support widget)
export async function POST(req: NextRequest) {
  await ensureTable();
  const user = await getAuthUser();
  const { message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

  let orgName = "";
  if (user?.orgId) {
    const org = await db.organization.findUnique({ where: { id: user.orgId }, select: { name: true } });
    orgName = org?.name || "";
  }

  await db.$executeRawUnsafe(
    `INSERT INTO support_tickets (user_id, user_email, user_name, org_id, org_name, message) VALUES ($1, $2, $3, $4, $5, $6)`,
    user?.id || null,
    user?.email || "anonymous",
    user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email : "Anonymous",
    user?.orgId || null,
    orgName,
    message.trim()
  );

  return NextResponse.json({ success: true });
}

// GET — list tickets (admin only)
export async function GET() {
  await ensureTable();
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // If admin, return all. If regular user, return only their tickets
  const isAdmin = user.role === "SUPER_ADMIN";
  const tickets = isAdmin
    ? await db.$queryRawUnsafe(`SELECT id, user_email, user_name, org_name, message, admin_reply, replied_at, status, created_at, resolved_at FROM support_tickets ORDER BY created_at DESC LIMIT 100`) as any[]
    : await db.$queryRawUnsafe(`SELECT id, message, admin_reply, replied_at, status, created_at FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`, user.id) as any[];

  return NextResponse.json(tickets);
}

// PUT — update ticket status
export async function PUT(req: NextRequest) {
  await ensureTable();
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status, reply } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (reply) {
    await db.$executeRawUnsafe(
      `UPDATE support_tickets SET admin_reply = $1, replied_at = NOW(), status = 'replied' WHERE id = $2`,
      reply, id
    );
  } else if (status) {
    await db.$executeRawUnsafe(
      `UPDATE support_tickets SET status = $1, resolved_at = $2 WHERE id = $3`,
      status, status === "resolved" ? new Date() : null, id
    );
  }

  return NextResponse.json({ success: true });
}

// DELETE — remove ticket
export async function DELETE(req: NextRequest) {
  await ensureTable();
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db.$executeRawUnsafe(`DELETE FROM support_tickets WHERE id = $1`, id);
  return NextResponse.json({ success: true });
}
