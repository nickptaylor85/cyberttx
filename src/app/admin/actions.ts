"use server";

import { db } from "@/lib/db";

export async function getOrganizations() {
  return db.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true, ttxSessions: true } } },
  });
}

export async function createOrganization(data: {
  name: string; slug: string; plan?: string; isDemo?: boolean;
  maxUsers?: number; maxTtxPerMonth?: number;
}) {
  if (!data.name || !data.slug) throw new Error("Name and slug required");
  const slug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const existing = await db.organization.findUnique({ where: { slug } });
  if (existing) throw new Error("Subdomain already taken");

  // Use STARTER as safe default — GROWTH might not exist in DB enum yet
  const safePlan = ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"].includes(data.plan || "")
    ? data.plan! : "STARTER";

  return db.organization.create({
    data: {
      name: data.name,
      slug,
      plan: safePlan as any,
      isDemo: data.isDemo || false,
      maxUsers: data.maxUsers || 25,
      maxTtxPerMonth: data.maxTtxPerMonth || 15,
    },
  });
}

export async function deleteOrganization(id: string) {
  const sessions = await db.ttxSession.findMany({ where: { orgId: id }, select: { id: true } });
  for (const s of sessions) {
    await db.ttxAnswer.deleteMany({ where: { participant: { sessionId: s.id } } });
    await db.ttxParticipant.deleteMany({ where: { sessionId: s.id } });
    await db.scenarioFeedback.deleteMany({ where: { sessionId: s.id } });
  }
  await db.ttxSession.deleteMany({ where: { orgId: id } });
  await db.user.deleteMany({ where: { orgId: id } });
  await db.orgSecurityTool.deleteMany({ where: { orgId: id } });
  await db.organization.delete({ where: { id } });
  return { success: true };
}

export async function getAllSessions() {
  return db.ttxSession.findMany({
    orderBy: { createdAt: "desc" }, take: 100,
    include: {
      organization: { select: { name: true } },
      createdBy: { select: { firstName: true, email: true } },
      _count: { select: { participants: true } },
    },
  });
}

export async function deleteSession(id: string) {
  await db.ttxAnswer.deleteMany({ where: { participant: { sessionId: id } } });
  await db.ttxParticipant.deleteMany({ where: { sessionId: id } });
  await db.scenarioFeedback.deleteMany({ where: { sessionId: id } });
  await db.ttxSession.delete({ where: { id } });
  return { success: true };
}

export async function bulkDeleteSessions(status: string) {
  const sessions = await db.ttxSession.findMany({ where: { status: status as any }, select: { id: true } });
  for (const s of sessions) {
    await db.ttxAnswer.deleteMany({ where: { participant: { sessionId: s.id } } });
    await db.ttxParticipant.deleteMany({ where: { sessionId: s.id } });
    await db.scenarioFeedback.deleteMany({ where: { sessionId: s.id } });
  }
  const result = await db.ttxSession.deleteMany({ where: { status: status as any } });
  return { deleted: result.count };
}

export async function sendInvites(orgId: string, emailList: string[]) {
  const org = await db.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new Error("Org not found");

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const results: { email: string; status: string }[] = [];

  for (const email of emailList.slice(0, 20)) {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) { results.push({ email: trimmed, status: "invalid" }); continue; }

    const existing = await db.user.findFirst({ where: { email: trimmed, orgId: org.id, clerkId: { not: { startsWith: "pending_" } } } });
    if (existing) { results.push({ email: trimmed, status: "already_member" }); continue; }

    const pendingExists = await db.user.findFirst({ where: { email: trimmed, clerkId: { startsWith: "pending_" } } });
    if (!pendingExists) {
      await db.user.create({
        data: {
          clerkId: `pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          email: trimmed, role: "MEMBER", orgId: org.id,
        },
      });
    }

    const signUpUrl = `https://threatcast.io/sign-up?email=${encodeURIComponent(trimmed)}&org=${encodeURIComponent(org.name)}&slug=${org.slug}`;

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
              <h1 style="font-size:20px;margin-bottom:16px;">You've been invited to ${org.name}</h1>
              <p style="color:#333;line-height:1.6;">Your organisation is using ThreatCast for AI-powered cybersecurity tabletop exercises. Click below to create your account.</p>
              <a href="${signUpUrl}" style="display:inline-block;background:#14b89a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Create Account →</a>
              <p style="color:#999;font-size:12px;margin-top:24px;">This invitation was sent to <strong>${trimmed}</strong>. Your account will be automatically linked to ${org.name}.</p>
            </div>`,
          }),
        });
        results.push({ email: trimmed, status: "sent" });
      } catch { results.push({ email: trimmed, status: "failed" }); }
    } else {
      results.push({ email: trimmed, status: "invitation_created" });
    }
  }
  return { results, sent: results.filter(r => r.status === "sent" || r.status === "invitation_created").length };
}

export async function exportClients() {
  const orgs = await db.organization.findMany({ include: { _count: { select: { users: true, ttxSessions: true } } } });
  return "Name,Slug,Plan,Demo,Users,Exercises,Created\n" + orgs.map(o =>
    `"${o.name}",${o.slug},${o.plan},${o.isDemo},${o._count.users},${o._count.ttxSessions},${o.createdAt.toISOString()}`
  ).join("\n");
}

export async function exportUsers() {
  const users = await db.user.findMany({ include: { organization: { select: { name: true } }, _count: { select: { participations: true } } } });
  return "Name,Email,Role,Organization,Exercises,Active,Created\n" + users.filter(u => !u.clerkId.startsWith("pending_")).map(u =>
    `"${u.firstName || ''} ${u.lastName || ''}",${u.email},${u.role},"${u.organization?.name || ''}",${u._count.participations},${u.isActive},${u.createdAt.toISOString()}`
  ).join("\n");
}

export async function exportSessions() {
  const sessions = await db.ttxSession.findMany({ include: { organization: { select: { name: true } }, _count: { select: { participants: true } } } });
  return "Title,Theme,Difficulty,Status,Organization,Participants,Created,Completed\n" + sessions.map(s =>
    `"${(s.title || '').replace(/"/g, '""')}",${s.theme},${s.difficulty},${s.status},"${s.organization?.name || ''}",${s._count.participants},${s.createdAt.toISOString()},${s.completedAt?.toISOString() || ''}`
  ).join("\n");
}

export async function bulkEmailAdmins(subject: string, html: string) {
  const admins = await db.user.findMany({
    where: { role: "CLIENT_ADMIN", clerkId: { startsWith: "hash:" } },
    select: { email: true, firstName: true },
  });
  if (!process.env.RESEND_API_KEY) return { sent: 0, total: admins.length, error: "RESEND_API_KEY not set" };
  let sent = 0;
  for (const admin of admins) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: "ThreatCast <noreply@threatcast.io>", to: [admin.email], subject, html }),
      });
      sent++;
    } catch {}
  }
  return { sent, total: admins.length };
}

export async function resetAllUsageCounters() {
  const result = await db.organization.updateMany({ data: { ttxUsedThisMonth: 0, billingCycleStart: new Date() } });
  return { updated: result.count };
}

export async function cleanupStuckSessions() {
  const fiveMinAgo = new Date(Date.now() - 300000);
  const stuck = await db.ttxSession.updateMany({
    where: { status: "GENERATING", createdAt: { lt: fiveMinAgo } },
    data: { status: "CANCELLED" },
  });
  return { cleaned: stuck.count };
}
