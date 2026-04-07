export const dynamic = "force-dynamic";
export const maxDuration = 60;
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });

  const { subject, body, audience, orgId } = await req.json();
  if (!subject || !body) return NextResponse.json({ error: "Subject and body required" }, { status: 400 });

  // Get recipients based on audience filter
  let users;
  if (audience === "portal" && orgId) {
    users = await db.user.findMany({
      where: { orgId, clerkId: { startsWith: "hash:" }, isActive: true },
      select: { email: true, firstName: true },
    });
  } else if (audience === "admins") {
    users = await db.user.findMany({
      where: { role: "CLIENT_ADMIN", clerkId: { startsWith: "hash:" }, isActive: true },
      select: { email: true, firstName: true },
    });
  } else {
    // All active users
    users = await db.user.findMany({
      where: { clerkId: { startsWith: "hash:" }, isActive: true },
      select: { email: true, firstName: true },
    });
  }

  let sent = 0;
  let failed = 0;

  for (const recipient of users) {
    try {
      const personalised = body
        .replace(/{{name}}/g, recipient.firstName || "there")
        .replace(/{{email}}/g, recipient.email);

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "ThreatCast <onboarding@resend.dev>",
          to: [recipient.email],
          subject,
          html: `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
            <div style="font-size:20px;font-weight:700;margin-bottom:24px;">Threat<span style="color:#14b89a;">Cast</span></div>
            ${personalised}
            <div style="margin-top:32px;padding-top:16px;border-top:1px solid #333;">
              <a href="https://threatcast.io/portal" style="display:inline-block;background:#14b89a;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Open ThreatCast →</a>
            </div>
            <p style="color:#555;font-size:11px;margin-top:24px;">You're receiving this because you have a ThreatCast account. <a href="https://threatcast.io/portal/notifications" style="color:#14b89a;">Manage preferences</a></p>
          </div>`,
        }),
      });
      sent++;
    } catch {
      failed++;
    }
  }

  // Log the broadcast
  try {
    await db.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS email_broadcasts (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, subject TEXT, audience TEXT, recipients INT, sent INT, failed INT, sent_by TEXT, created_at TIMESTAMP DEFAULT NOW())`
    );
    await db.$executeRawUnsafe(
      `INSERT INTO email_broadcasts (subject, audience, recipients, sent, failed, sent_by) VALUES ($1, $2, $3, $4, $5, $6)`,
      subject, audience || "all", users.length, sent, failed, user.id
    );
  } catch {}

  return NextResponse.json({ success: true, recipients: users.length, sent, failed });
}

// GET — list past broadcasts
export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await db.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS email_broadcasts (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, subject TEXT, audience TEXT, recipients INT, sent INT, failed INT, sent_by TEXT, created_at TIMESTAMP DEFAULT NOW())`
    );
    const broadcasts = await db.$queryRawUnsafe(`SELECT * FROM email_broadcasts ORDER BY created_at DESC LIMIT 20`) as any[];
    return NextResponse.json(broadcasts);
  } catch {
    return NextResponse.json([]);
  }
}
