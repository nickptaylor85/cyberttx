import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

function isSuperAdmin(clerkId: string): boolean {
  const adminIds = (process.env.SUPER_ADMIN_CLERK_IDS || "").split(",").map(s => s.trim());
  return adminIds.includes(clerkId);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const clerkId = await getAuthUserId();
  if (!clerkId || !isSuperAdmin(clerkId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await db.organization.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const clerkId = await getAuthUserId();
  if (!clerkId || !isSuperAdmin(clerkId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const org = await db.organization.update({ where: { id }, data: body });
  return NextResponse.json(org);
}
