export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await db.organization.findUnique({ where: { id: user.orgId } });
  if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

  const { emails } = await req.json();
  if (!emails?.length) return NextResponse.json({ error: "No emails provided" }, { status: 400 });

  const results: { email: string; status: string }[] = [];
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  for (const email of emails.slice(0, 20)) {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) { results.push({ email: trimmed, status: "invalid" }); continue; }

    // Check if already a member
    const existing = await db.user.findFirst({ where: { email: trimmed, orgId: org.id } });
    if (existing) { results.push({ email: trimmed, status: "already_member" }); continue; }

    // Create pending invitation record (matched on Clerk webhook or getAuthUser)
    const pendingExists = await db.user.findFirst({ where: { email: trimmed, clerkId: { startsWith: "pending_" } } });
    if (!pendingExists) {
      await db.user.create({
        data: {
          clerkId: `pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          email: trimmed,
          role: "MEMBER",
          orgId: org.id,
        },
      });
    }

    // Send invitation email
    if (RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "ThreatCast <noreply@threatcast.io>",
            to: [trimmed],
            subject: `You've been invited to ${org.name} on ThreatCast`,
            html: `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
              <div style="font-size:20px;font-weight:700;margin-bottom:24px;">Threat<span style="color:#14b89a;">Cast</span></div>
              <h1 style="font-size:20px;margin-bottom:16px;">${user.firstName || 'Your colleague'} invited you to ${org.name}</h1>
              <p style="color:#333;line-height:1.6;">Join your team on ThreatCast to participate in AI-powered cybersecurity tabletop exercises.</p>
              <p style="color:#666;font-size:14px;">Sign up with this email address (<strong>${trimmed}</strong>) and you'll be automatically added to ${org.name}.</p>
              <a href="https://threatcast.io/sign-up" style="display:inline-block;background:#14b89a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Accept Invitation →</a>
            </div>`,
          }),
        });
        results.push({ email: trimmed, status: "sent" });
      } catch { results.push({ email: trimmed, status: "failed" }); }
    } else {
      results.push({ email: trimmed, status: "invitation_created" });
    }
  }

  return NextResponse.json({ results, sent: results.filter(r => r.status === "sent" || r.status === "invitation_created").length });
}
