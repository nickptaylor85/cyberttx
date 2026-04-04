import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

function isSuperAdmin(userId: string): boolean {
  const adminIds = (process.env.SUPER_ADMIN_CLERK_IDS || "").split(",").map(s => s.trim());
  return adminIds.includes(userId);
}

export async function GET() {
  const { userId } = await auth();
  if (!userId || !isSuperAdmin(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const orgs = await db.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true, ttxSessions: true } } },
  });

  return NextResponse.json(orgs);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId || !isSuperAdmin(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { name, slug, plan, isDemo, maxUsers, maxTtxPerMonth } = body;

  if (!name || !slug) {
    return NextResponse.json({ error: "Name and slug required" }, { status: 400 });
  }

  // Check slug uniqueness
  const existing = await db.organization.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Subdomain already taken" }, { status: 409 });
  }

  const org = await db.organization.create({
    data: {
      name,
      slug: slug.toLowerCase(),
      plan: plan || "STARTER",
      isDemo: isDemo || false,
      maxUsers: maxUsers || 15,
      maxTtxPerMonth: maxTtxPerMonth || 15,
    },
  });

  return NextResponse.json(org, { status: 201 });
}
