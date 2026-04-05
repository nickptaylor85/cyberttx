import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await db.orgProfile.findUnique({ where: { orgId: user.orgId } });
  return NextResponse.json(profile || {});
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, orgId, updatedAt, organization, ...data } = body;
  const profile = await db.orgProfile.upsert({
    where: { orgId: user.orgId },
    create: { orgId: user.orgId, ...data },
    update: data,
  });
  return NextResponse.json(profile);
}
