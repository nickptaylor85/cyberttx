import { auth, currentUser } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";

/**
 * Get or create the current user in our DB, linked to the correct org.
 * This handles the case where the Clerk webhook hasn't fired yet.
 */
export async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) return null;

  // Check if user already exists
  let user = await db.user.findUnique({ where: { clerkId: userId } });

  if (!user) {
    // Auto-provision: fetch from Clerk and create in DB
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    // Determine org from subdomain header
    const headersList = await headers();
    const slug = headersList.get("x-org-slug");
    let orgId: string | null = null;

    if (slug) {
      const org = await db.organization.findUnique({ where: { slug } });
      if (org) orgId = org.id;
    }

    // Check if super admin
    const superAdminIds = (process.env.SUPER_ADMIN_CLERK_IDS || "").split(",").map((s) => s.trim());
    const isSuperAdmin = superAdminIds.includes(userId);

    user = await db.user.create({
      data: {
        clerkId: userId,
        email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
        firstName: clerkUser.firstName || null,
        lastName: clerkUser.lastName || null,
        avatarUrl: clerkUser.imageUrl || null,
        role: isSuperAdmin ? "SUPER_ADMIN" : orgId ? "CLIENT_ADMIN" : "MEMBER",
        orgId,
      },
    });
  } else if (!user.orgId) {
    // User exists but has no org — try to link from subdomain
    const headersList = await headers();
    const slug = headersList.get("x-org-slug");
    if (slug) {
      const org = await db.organization.findUnique({ where: { slug } });
      if (org) {
        user = await db.user.update({
          where: { id: user.id },
          data: { orgId: org.id },
        });
      }
    }
  }

  return user;
}

/**
 * Get org from the x-org-slug header (set by middleware)
 */
export async function getOrgFromSlug() {
  const headersList = await headers();
  const slug = headersList.get("x-org-slug") || "demo";
  return db.organization.findUnique({ where: { slug } });
}
