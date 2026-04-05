import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allTools = await db.securityTool.findMany({ where: { isActive: true }, orderBy: { category: "asc" } });
  const orgTools = user.orgId
    ? await db.orgSecurityTool.findMany({ where: { orgId: user.orgId }, select: { toolId: true } })
    : [];
  return NextResponse.json({ allTools, selectedIds: orgTools.map((t) => t.toolId) });
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { toolIds } = await req.json();
  await db.orgSecurityTool.deleteMany({ where: { orgId: user.orgId } });
  if (toolIds?.length > 0) {
    await db.orgSecurityTool.createMany({
      data: toolIds.map((toolId: string) => ({ orgId: user.orgId!, toolId })),
    });
  }
  return NextResponse.json({ success: true });
}
