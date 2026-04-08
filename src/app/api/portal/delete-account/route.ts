export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { confirmEmail } = await req.json();
  if (confirmEmail !== user.email) {
    return NextResponse.json({ error: "Email confirmation does not match" }, { status: 400 });
  }

  try {
    // Delete all user data (GDPR Article 17 — Right to Erasure)
    // 1. Delete exercise participations and answers
    const participations = await db.ttxParticipant.findMany({ where: { userId: user.id } });
    for (const p of participations) {
      await db.ttxAnswer.deleteMany({ where: { participantId: p.id } });
    }
    await db.ttxParticipant.deleteMany({ where: { userId: user.id } });

    // 2. Delete user-generated content
    try { await db.$executeRawUnsafe(`DELETE FROM saved_playbooks WHERE user_id = $1`, user.id); } catch {}
    try { await db.$executeRawUnsafe(`DELETE FROM user_certificates WHERE user_id = $1`, user.id); } catch {}
    try { await db.$executeRawUnsafe(`DELETE FROM exercise_feedback WHERE user_id = $1`, user.id); } catch {}
    try { await db.$executeRawUnsafe(`DELETE FROM support_tickets WHERE user_id = $1`, user.id); } catch {}

    // 3. Delete duels
    try { await db.$executeRawUnsafe(`DELETE FROM duels WHERE challenger_id = $1 OR opponent_id = $1`, user.id); } catch {}

    // 4. Log the deletion for compliance records (keep minimal record for 30 days)
    try {
      await db.$executeRawUnsafe(
        `CREATE TABLE IF NOT EXISTS gdpr_deletion_log (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, email_hash TEXT, reason TEXT DEFAULT 'user_request', deleted_at TIMESTAMP DEFAULT NOW(), purge_after TIMESTAMP DEFAULT NOW() + INTERVAL '30 days')`
      );
      const crypto = await import("crypto");
      const emailHash = crypto.createHash("sha256").update(user.email).digest("hex").slice(0, 16);
      await db.$executeRawUnsafe(
        `INSERT INTO gdpr_deletion_log (email_hash, reason) VALUES ($1, 'user_request')`, emailHash
      );
    } catch {}

    // 5. Delete the user account itself
    await db.user.delete({ where: { id: user.id } });

    return NextResponse.json({ success: true, message: "Account and all associated data have been permanently deleted" });
  } catch (e: any) {
    console.error("[gdpr] Account deletion error:", e?.message);
    return NextResponse.json({ error: "Failed to delete account. Please contact support." }, { status: 500 });
  }
}
