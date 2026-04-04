import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getOrCreateUser();
  if (!user?.orgId) return NextResponse.json({});
  const profile = await db.orgProfile.findUnique({ where: { orgId: user.orgId } });
  return NextResponse.json(profile || {});
}

export async function PUT(req: NextRequest) {
  const user = await getOrCreateUser();
  if (!user?.orgId) return NextResponse.json({ error: "No org" }, { status: 403 });
  const body = await req.json();
  const { id, orgId, updatedAt, organization, ...data } = body;
  const profile = await db.orgProfile.upsert({
    where: { orgId: user.orgId },
    create: { orgId: user.orgId, ...data },
    update: data,
  });
  return NextResponse.json(profile);
}
