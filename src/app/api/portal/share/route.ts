export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = await req.json();
  const session = await db.ttxSession.findFirst({ where: { id: sessionId, orgId: user.orgId, status: "COMPLETED" } });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Generate a share token
  const token = Array.from({ length: 16 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");
  // Store in additionalContext-style approach
  try {
    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS shared_exercises (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, session_id TEXT NOT NULL, token TEXT NOT NULL UNIQUE, created_by TEXT, created_at TIMESTAMP DEFAULT NOW())`);
    await db.$executeRawUnsafe(`INSERT INTO shared_exercises (session_id, token, created_by) VALUES ($1, $2, $3) ON CONFLICT (token) DO NOTHING`, sessionId, token, user.id);
  } catch {}

  return NextResponse.json({ shareUrl: `https://threatcast.io/shared/${token}` });
}
