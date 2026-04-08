export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId || user.role !== "CLIENT_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { confirmName } = await req.json();
  const org = await db.organization.findUnique({ where: { id: user.orgId } });
  if (!org || confirmName !== org.name) {
    return NextResponse.json({ error: "Organisation name confirmation does not match" }, { status: 400 });
  }

  try {
    const sessions = await db.ttxSession.findMany({ where: { orgId: org.id }, select: { id: true } });
    for (const s of sessions) {
      const parts = await db.ttxParticipant.findMany({ where: { sessionId: s.id }, select: { id: true } });
      for (const p of parts) { await db.ttxAnswer.deleteMany({ where: { participantId: p.id } }); }
      await db.ttxParticipant.deleteMany({ where: { sessionId: s.id } });
    }
    await db.ttxSession.deleteMany({ where: { orgId: org.id } });
    await db.ttxCharacter.deleteMany({ where: { orgId: org.id } });
    await db.orgSecurityTool.deleteMany({ where: { orgId: org.id } });
    try { await db.orgProfile.deleteMany({ where: { orgId: org.id } }); } catch {}

    const tables = ["saved_playbooks", "user_certificates", "duels", "scheduled_exercises", "support_tickets", "exercise_feedback"];
    for (const t of tables) { try { await db.$executeRawUnsafe(`DELETE FROM ${t} WHERE org_id = $1`, org.id); } catch {} }

    await db.user.deleteMany({ where: { orgId: org.id } });
    await db.organization.delete({ where: { id: org.id } });

    try {
      await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS gdpr_deletion_log (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, email_hash TEXT, reason TEXT, deleted_at TIMESTAMP DEFAULT NOW())`);
      await db.$executeRawUnsafe(`INSERT INTO gdpr_deletion_log (email_hash, reason) VALUES ($1, 'org_deletion')`, org.slug);
    } catch {}

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[gdpr] Org deletion error:", e?.message);
    return NextResponse.json({ error: "Failed to delete organisation" }, { status: 500 });
  }
}
