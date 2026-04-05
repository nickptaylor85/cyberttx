import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { findOrgForEmail } from "@/lib/org-matching";

/**
 * Get the authenticated user's DB ID from NextAuth session.
 */
export async function getAuthUserId(): Promise<string | null> {
  // Check middleware-injected header first
  const headersList = await headers();
  const fromHeader = headersList.get("x-user-id");
  if (fromHeader) return fromHeader;

  // Fall back to NextAuth session
  try {
    const session = await auth();
    return (session as any)?.userId || null;
  } catch {
    return null;
  }
}

/**
 * Get the authenticated user from the database.
 */
export async function getAuthUser() {
  const userId = await getAuthUserId();
  if (!userId) return null;

  let user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  // Auto-promote to SUPER_ADMIN if no super admins exist
  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  if (superAdminEmails.includes(user.email.toLowerCase()) && user.role !== "SUPER_ADMIN") {
    user = await db.user.update({ where: { id: user.id }, data: { role: "SUPER_ADMIN" } });
  }
  if (user.role !== "SUPER_ADMIN") {
    const existingSuperAdmins = await db.user.count({ where: { role: "SUPER_ADMIN" } });
    if (existingSuperAdmins === 0) {
      user = await db.user.update({ where: { id: user.id }, data: { role: "SUPER_ADMIN" } });
    }
  }

  // If user has no org, try to match by email
  if (!user.orgId) {
    let matchedOrgId: string | null = null;
    if (user.email) matchedOrgId = await findOrgForEmail(user.email);
    if (!matchedOrgId) {
      const headersList = await headers();
      const slug = headersList.get("x-org-slug");
      if (slug && slug !== "demo") {
        const org = await db.organization.findUnique({ where: { slug } });
        if (org) matchedOrgId = org.id;
      }
    }
    if (!matchedOrgId) {
      const demo = await db.organization.findUnique({ where: { slug: "demo" } });
      if (demo) matchedOrgId = demo.id;
    }
    if (matchedOrgId) {
      // Check if this org already has a CLIENT_ADMIN — if not, promote this user
      const existingAdmins = await db.user.count({ where: { orgId: matchedOrgId, role: "CLIENT_ADMIN" } });
      const newRole = existingAdmins === 0 ? "CLIENT_ADMIN" : user.role;
      user = await db.user.update({ where: { id: user.id }, data: { orgId: matchedOrgId, role: newRole !== "SUPER_ADMIN" ? newRole : user.role } });
    }
  }

  return user;
}

export async function getAuthUserForOrg(requiredOrgId: string) {
  const user = await getAuthUser();
  if (!user) return null;
  if (user.role === "SUPER_ADMIN") return user;
  if (user.orgId !== requiredOrgId) return null;
  return user;
}
