export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { challengeId, sessionId, accuracy } = await req.json();
  if (!challengeId || !sessionId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  try {
    await db.$executeRawUnsafe(
      `INSERT INTO challenge_attempts (challenge_id, user_id, org_id, session_id, accuracy) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (challenge_id, user_id) DO UPDATE SET accuracy = GREATEST(challenge_attempts.accuracy, $5), session_id = $4`,
      challengeId, user.id, user.orgId, sessionId, accuracy || 0
    );
  } catch {}
  return NextResponse.json({ success: true });
}
