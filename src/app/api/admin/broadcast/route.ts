export const dynamic = "force-dynamic";
export const maxDuration = 60;
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { subject, body, audience, orgId } = await req.json();
  if (!subject || !body) return NextResponse.json({ error: "Subject and body required" }, { status: 400 });

  let users;
  if (audience === "portal" && orgId) {
    users = await db.user.findMany({ where: { orgId, clerkId: { startsWith: "hash:" }, isActive: true }, select: { email: true, firstName: true } });
  } else if (audience === "admins") {
    users = await db.user.findMany({ where: { role: "CLIENT_ADMIN", clerkId: { startsWith: "hash:" }, isActive: true }, select: { email: true, firstName: true } });
  } else {
    users = await db.user.findMany({ where: { clerkId: { startsWith: "hash:" }, isActive: true }, select: { email: true, firstName: true } });
  }

  let sent = 0, failed = 0;

  for (const recipient of users) {
    const personalised = body
      .replace(/\{\{name\}\}/g, recipient.firstName || "there")
      .replace(/\{\{email\}\}/g, recipient.email);

    const result = await sendEmail({
      to: recipient.email,
      subject,
      type: "broadcast",
      from: "ThreatCast <hello@threatcast.io>",
      html: `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;"><div style="font-family:monospace;font-size:18px;font-weight:800;letter-spacing:2px;margin-bottom:24px;"><span style="color:#f0f0f0;">THREAT</span><span style="color:#00ffd5;">CAST</span></div>${personalised}<div style="margin-top:32px;padding-top:16px;border-top:1px solid #333;"><a href="https://threatcast.io/portal" style="display:inline-block;background:#14b89a;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Open ThreatCast →</a></div><p style="color:#555;font-size:11px;margin-top:24px;">You're receiving this because you have a ThreatCast account. <a href="https://threatcast.io/portal/notifications" style="color:#14b89a;">Manage preferences</a></p></div>`,
    });

    if (result.success) sent++;
    else failed++;
  }

  // Log broadcast
  try {
    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS email_broadcasts (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, subject TEXT, audience TEXT, recipients INT, sent INT, failed INT, sent_by TEXT, created_at TIMESTAMP DEFAULT NOW())`);
    await db.$executeRawUnsafe(`INSERT INTO email_broadcasts (subject, audience, recipients, sent, failed, sent_by) VALUES ($1, $2, $3, $4, $5, $6)`, subject, audience || "all", users.length, sent, failed, user.id);
  } catch {}

  return NextResponse.json({ success: true, recipients: users.length, sent, failed });
}

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS email_broadcasts (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, subject TEXT, audience TEXT, recipients INT, sent INT, failed INT, sent_by TEXT, created_at TIMESTAMP DEFAULT NOW())`);
    const broadcasts = await db.$queryRawUnsafe(`SELECT * FROM email_broadcasts ORDER BY created_at DESC LIMIT 20`) as any[];
    return NextResponse.json(broadcasts);
  } catch { return NextResponse.json([]); }
}
