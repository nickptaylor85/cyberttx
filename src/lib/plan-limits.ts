import { db } from "@/lib/db";

export const PLAN_LIMITS: Record<string, { users: number; exercisesPerMonth: number; price: number }> = {
  FREE: { users: 3, exercisesPerMonth: 3, price: 0 },
  STARTER: { users: 10, exercisesPerMonth: 10, price: 99 },
  GROWTH: { users: 25, exercisesPerMonth: 25, price: 249 },
  PROFESSIONAL: { users: 50, exercisesPerMonth: 9999, price: 499 },
  ENTERPRISE: { users: 9999, exercisesPerMonth: 9999, price: 999 },
};

export async function checkExerciseLimit(orgId: string): Promise<{ allowed: boolean; used: number; limit: number; plan: string }> {
  const org = await db.organization.findUnique({ where: { id: orgId }, select: { plan: true, maxTtxPerMonth: true } });
  if (!org) return { allowed: false, used: 0, limit: 0, plan: "NONE" };

  const planLimits = PLAN_LIMITS[org.plan] || PLAN_LIMITS.FREE;
  const limit = org.maxTtxPerMonth >= 9999 ? 9999 : (org.maxTtxPerMonth || planLimits.exercisesPerMonth);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const used = await db.ttxSession.count({
    where: { orgId, createdAt: { gte: startOfMonth } },
  });

  return { allowed: used < limit, used, limit, plan: org.plan };
}

export async function checkUserLimit(orgId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  const org = await db.organization.findUnique({ where: { id: orgId }, select: { plan: true, maxUsers: true } });
  if (!org) return { allowed: false, current: 0, limit: 0 };

  const planLimits = PLAN_LIMITS[org.plan] || PLAN_LIMITS.FREE;
  const limit = org.maxUsers >= 9999 ? 9999 : (org.maxUsers || planLimits.users);

  const current = await db.user.count({ where: { orgId, clerkId: { startsWith: "hash:" } } });

  return { allowed: current < limit, current, limit };
}
