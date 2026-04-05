import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify character belongs to user's org
  const existing = await db.ttxCharacter.findUnique({ where: { id } });
  if (!existing || existing.orgId !== user.orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const character = await db.ttxCharacter.update({
    where: { id },
    data: {
      name: body.name, role: body.role,
      department: body.department || null, description: body.description || null,
      expertise: body.expertise || [], isRecurring: body.isRecurring,
    },
  });
  return NextResponse.json(character);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify character belongs to user's org
  const existing = await db.ttxCharacter.findUnique({ where: { id } });
  if (!existing || existing.orgId !== user.orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.ttxCharacter.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
