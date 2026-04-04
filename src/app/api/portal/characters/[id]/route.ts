import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const character = await db.ttxCharacter.update({
    where: { id },
    data: {
      name: body.name,
      role: body.role,
      department: body.department || null,
      description: body.description || null,
      expertise: body.expertise || [],
      isRecurring: body.isRecurring,
    },
  });

  return NextResponse.json(character);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.ttxCharacter.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
