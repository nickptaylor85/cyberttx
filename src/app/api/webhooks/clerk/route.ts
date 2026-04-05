import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { findOrgForEmail } from "@/lib/org-matching";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Server config error" }, { status: 500 });
  }

  let event: any;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { type, data } = event;
  const email = data.email_addresses?.[0]?.email_address || "";

  switch (type) {
    case "user.created": {
      // 1. Check Clerk metadata for org slug (set via invitation links)
      const orgSlug = data.public_metadata?.org_slug;
      let orgId: string | null = null;
      let role: "SUPER_ADMIN" | "CLIENT_ADMIN" | "MEMBER" = "MEMBER";

      if (orgSlug) {
        const org = await db.organization.findUnique({ where: { slug: orgSlug } });
        if (org) { orgId = org.id; role = data.public_metadata?.role === "admin" ? "CLIENT_ADMIN" : "MEMBER"; }
      }

      // 2. If no org from metadata, match by email (invitation or domain)
      if (!orgId && email) {
        orgId = await findOrgForEmail(email);
        if (orgId) role = "MEMBER";

        // If matched via pending invitation, clean up the pending record
        if (orgId) {
          const pending = await db.user.findFirst({
            where: { email: email.toLowerCase(), clerkId: { startsWith: "pending_" } },
          });
          if (pending) {
            await db.user.delete({ where: { id: pending.id } });
          }
        }
      }

      // 3. Check if this is a super admin
      const superAdminIds = (process.env.SUPER_ADMIN_CLERK_IDS || "").split(",").map(s => s.trim()).filter(Boolean);
      const isSuperAdmin = superAdminIds.includes(data.id);

      await db.user.upsert({
        where: { clerkId: data.id },
        create: {
          clerkId: data.id,
          email: email,
          firstName: data.first_name || null,
          lastName: data.last_name || null,
          avatarUrl: data.image_url || null,
          role: isSuperAdmin ? "SUPER_ADMIN" : role,
          orgId,
        },
        update: {
          email, firstName: data.first_name || null,
          lastName: data.last_name || null, avatarUrl: data.image_url || null,
          ...(orgId && !isSuperAdmin ? { orgId } : {}),
        },
      });

      console.log(`[clerk] User ${data.id} created: ${email} → org ${orgId || "none"} (${role})`);
      break;
    }

    case "user.updated": {
      await db.user.updateMany({
        where: { clerkId: data.id },
        data: {
          email, firstName: data.first_name || null,
          lastName: data.last_name || null, avatarUrl: data.image_url || null,
        },
      });
      break;
    }

    case "user.deleted": {
      await db.user.updateMany({ where: { clerkId: data.id }, data: { isActive: false } });
      break;
    }
  }

  return NextResponse.json({ success: true });
}
