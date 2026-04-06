export const dynamic = "force-dynamic";
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
  const { industry, companySize, securityTools, ...rest } = await req.json();

  await db.orgProfile.upsert({
    where: { orgId: user.orgId },
    update: { ...(industry && { industry }), ...(companySize && { companySize }), ...rest },
    create: { orgId: user.orgId, industry: industry || "", companySize: companySize || "", ...rest },
  });

  return NextResponse.json({ success: true });
}
