import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user?.orgId) {
    return NextResponse.json({ error: "No org" }, { status: 403 });
  }

  const [allTools, orgTools] = await Promise.all([
    db.securityTool.findMany({ where: { isActive: true }, orderBy: { category: "asc" } }),
    db.orgSecurityTool.findMany({ where: { orgId: user.orgId }, select: { toolId: true } }),
  ]);

  return NextResponse.json({
    allTools,
    selectedIds: orgTools.map((t) => t.toolId),
  });
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user?.orgId) {
    return NextResponse.json({ error: "No org" }, { status: 403 });
  }

  // Only client admins can modify tools
  if (user.role !== "CLIENT_ADMIN" && user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { toolIds } = await req.json();

  // Delete existing and re-create
  await db.orgSecurityTool.deleteMany({ where: { orgId: user.orgId } });
  
  if (toolIds.length > 0) {
    await db.orgSecurityTool.createMany({
      data: toolIds.map((toolId: string) => ({
        orgId: user.orgId!,
        toolId,
      })),
    });
  }

  return NextResponse.json({ success: true, count: toolIds.length });
}
