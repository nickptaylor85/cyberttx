import { headers } from "next/headers";
import { db } from "@/lib/db";

/**
 * Get the authenticated user's Clerk ID from the middleware-injected header.
 * This avoids calling Clerk's auth() which can hang on POST requests.
 * The middleware has ALREADY validated the session — this just reads the result.
 */
export async function getAuthUserId(): Promise<string | null> {
  const headersList = await headers();
  const fromMiddleware = headersList.get("x-clerk-user-id");
  if (fromMiddleware) return fromMiddleware;
  
  // Fallback: try Clerk auth() directly (for cases where middleware didn't inject)
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    return userId;
  } catch {
    return null;
  }
}

/**
 * Get or create the authenticated user in the DB, linked to their org.
 * Returns null if not authenticated (middleware should prevent this).
 */
export async function getAuthUser() {
  const clerkId = await getAuthUserId();
  if (!clerkId) return null;

  let user = await db.user.findUnique({ where: { clerkId } });

  if (user) {
    // Sync SUPER_ADMIN role from env var (in case it was updated after provisioning)
    const superAdminIds = (process.env.SUPER_ADMIN_CLERK_IDS || "").split(",").map(s => s.trim()).filter(Boolean);
    if (superAdminIds.includes(clerkId) && user.role !== "SUPER_ADMIN") {
      user = await db.user.update({ where: { id: user.id }, data: { role: "SUPER_ADMIN" } });
    }
    // If no SUPER_ADMIN_CLERK_IDS set and no super admins exist, promote this user
    if (superAdminIds.length === 0 && user.role !== "SUPER_ADMIN") {
      const existingSuperAdmins = await db.user.count({ where: { role: "SUPER_ADMIN" } });
      if (existingSuperAdmins === 0) {
        user = await db.user.update({ where: { id: user.id }, data: { role: "SUPER_ADMIN" } });
      }
    }
    // If user has no org, link to demo
    if (!user.orgId) {
      const headersList = await headers();
      const slug = headersList.get("x-org-slug") || "demo";
      const org = await db.organization.findUnique({ where: { slug } });
      if (org) {
        user = await db.user.update({ where: { id: user.id }, data: { orgId: org.id } });
      }
    }
    return user;
  }

  // Auto-provision new user
  const headersList = await headers();
  const slug = headersList.get("x-org-slug") || "demo";
  const org = await db.organization.findUnique({ where: { slug } });

  const superAdminIds = (process.env.SUPER_ADMIN_CLERK_IDS || "").split(",").map(s => s.trim());

  user = await db.user.create({
    data: {
      clerkId,
      email: `${clerkId}@cyberttx.app`,
      role: superAdminIds.includes(clerkId) ? "SUPER_ADMIN" : org ? "CLIENT_ADMIN" : "MEMBER",
      orgId: org?.id || null,
    },
  });

  return user;
}

/**
 * Get the user and verify they belong to the specified org.
 * Prevents IDOR attacks across tenants.
 */
export async function getAuthUserForOrg(requiredOrgId: string) {
  const user = await getAuthUser();
  if (!user) return null;
  if (user.role === "SUPER_ADMIN") return user; // Super admins can access any org
  if (user.orgId !== requiredOrgId) return null; // Tenant isolation
  return user;
}
