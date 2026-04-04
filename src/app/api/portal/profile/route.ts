import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user?.orgId) return NextResponse.json({ error: "No org" }, { status: 403 });

  const profile = await db.orgProfile.findUnique({ where: { orgId: user.orgId } });
  return NextResponse.json(profile || {});
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user?.orgId) return NextResponse.json({ error: "No org" }, { status: 403 });

  const body = await req.json();

  // Strip fields that shouldn't be set directly
  const { id, orgId, updatedAt, organization, ...data } = body;

  const profile = await db.orgProfile.upsert({
    where: { orgId: user.orgId },
    create: { orgId: user.orgId, ...data },
    update: data,
  });

  return NextResponse.json(profile);
}
