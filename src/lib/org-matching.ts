import { db } from "@/lib/db";

/**
 * Find the org that matches a user's email address.
 * Checks: 1) Pending invitations, 2) Allowed email domains on org profiles
 */
export async function findOrgForEmail(email: string): Promise<string | null> {
  if (!email) return null;
  const emailLower = email.toLowerCase();
  const domain = emailLower.split("@")[1];
  if (!domain) return null;

  // 1. Check pending invitations (stored in user table with orgId but no clerkId)
  const invited = await db.user.findFirst({
    where: { email: emailLower, clerkId: { startsWith: "pending_" } },
    select: { orgId: true },
  });
  if (invited?.orgId) return invited.orgId;

  // 2. Check allowed email domains on org profiles
  // Domains stored in additionalContext as DOMAINS:acme.com,acme.co.uk
  const profiles = await db.orgProfile.findMany({
    where: { additionalContext: { contains: "DOMAINS:" } },
    select: { orgId: true, additionalContext: true },
  });

  for (const p of profiles) {
    const match = (p.additionalContext || "").match(/DOMAINS:([^\s]+)/);
    if (match) {
      const domains = match[1].split(",").map(d => d.trim().toLowerCase());
      if (domains.includes(domain)) return p.orgId;
    }
  }

  return null;
}

/**
 * Get allowed domains for an org from its profile
 */
export async function getOrgDomains(orgId: string): Promise<string[]> {
  const profile = await db.orgProfile.findUnique({ where: { orgId }, select: { additionalContext: true } });
  const match = (profile?.additionalContext || "").match(/DOMAINS:([^\s]+)/);
  return match ? match[1].split(",").map(d => d.trim().toLowerCase()).filter(Boolean) : [];
}

/**
 * Set allowed domains for an org
 */
export async function setOrgDomains(orgId: string, domains: string[]): Promise<void> {
  const domainStr = domains.map(d => d.trim().toLowerCase()).filter(Boolean).join(",");
  const profile = await db.orgProfile.findUnique({ where: { orgId }, select: { additionalContext: true } });

  if (profile) {
    const ctx = (profile.additionalContext || "").replace(/DOMAINS:[^\s]*/, "").trim();
    await db.orgProfile.update({
      where: { orgId },
      data: { additionalContext: domainStr ? `DOMAINS:${domainStr} ${ctx}`.trim() : ctx },
    });
  } else {
    await db.orgProfile.create({
      data: { orgId, additionalContext: domainStr ? `DOMAINS:${domainStr}` : "" },
    });
  }
}
