import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const orgs = await db.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true, ttxSessions: true } } },
  });
  return NextResponse.json(orgs);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { name, slug, plan, isDemo, maxUsers, maxTtxPerMonth } = await req.json();
  if (!name || !slug) return NextResponse.json({ error: "Name and slug required" }, { status: 400 });
  const existing = await db.organization.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "Subdomain taken" }, { status: 409 });
  const org = await db.organization.create({
    data: { name, slug: slug.toLowerCase(), plan: plan || "GROWTH", isDemo: isDemo || false, maxUsers: maxUsers || 25, maxTtxPerMonth: maxTtxPerMonth || 15 },
  });
  return NextResponse.json(org, { status: 201 });
}
