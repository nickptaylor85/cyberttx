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
