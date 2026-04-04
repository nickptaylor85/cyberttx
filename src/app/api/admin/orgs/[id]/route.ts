import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

function isSuperAdmin(userId: string): boolean {
  const adminIds = (process.env.SUPER_ADMIN_CLERK_IDS || "").split(",").map(s => s.trim());
  return adminIds.includes(userId);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId || !isSuperAdmin(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  await db.organization.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId || !isSuperAdmin(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const org = await db.organization.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(org);
}
