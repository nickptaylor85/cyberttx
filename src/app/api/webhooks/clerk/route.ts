import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { db } from "@/lib/db";

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

  switch (type) {
    case "user.created": {
      // Check if user was invited to an org via metadata
      const orgSlug = data.public_metadata?.org_slug;
      let orgId: string | null = null;
      let role: "CLIENT_ADMIN" | "MEMBER" = "MEMBER";

      if (orgSlug) {
        const org = await db.organization.findUnique({ where: { slug: orgSlug } });
        if (org) {
          orgId = org.id;
          role = data.public_metadata?.role === "admin" ? "CLIENT_ADMIN" : "MEMBER";
        }
      }

      // Check if this is a super admin
      const superAdminIds = (process.env.SUPER_ADMIN_CLERK_IDS || "").split(",").map((s) => s.trim());
      const isSuperAdmin = superAdminIds.includes(data.id);

      await db.user.upsert({
        where: { clerkId: data.id },
        create: {
          clerkId: data.id,
          email: data.email_addresses?.[0]?.email_address || "",
          firstName: data.first_name || null,
          lastName: data.last_name || null,
          avatarUrl: data.image_url || null,
          role: isSuperAdmin ? "SUPER_ADMIN" : role,
          orgId,
        },
        update: {
          email: data.email_addresses?.[0]?.email_address || "",
          firstName: data.first_name || null,
          lastName: data.last_name || null,
          avatarUrl: data.image_url || null,
        },
      });
      break;
    }

    case "user.updated": {
      await db.user.updateMany({
        where: { clerkId: data.id },
        data: {
          email: data.email_addresses?.[0]?.email_address || "",
          firstName: data.first_name || null,
          lastName: data.last_name || null,
          avatarUrl: data.image_url || null,
        },
      });
      break;
    }

    case "user.deleted": {
      await db.user.updateMany({
        where: { clerkId: data.id },
        data: { isActive: false },
      });
      break;
    }
  }

  return NextResponse.json({ success: true });
}
