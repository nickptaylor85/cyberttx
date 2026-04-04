import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user?.orgId) return NextResponse.json({ error: "No org" }, { status: 403 });

  const characters = await db.ttxCharacter.findMany({
    where: { orgId: user.orgId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(characters);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user?.orgId) return NextResponse.json({ error: "No org" }, { status: 403 });

  const body = await req.json();
  const { name, role, department, description, expertise, isRecurring } = body;

  if (!name || !role) {
    return NextResponse.json({ error: "Name and role required" }, { status: 400 });
  }

  const character = await db.ttxCharacter.create({
    data: {
      orgId: user.orgId,
      name,
      role,
      department: department || null,
      description: description || null,
      expertise: expertise || [],
      isRecurring: isRecurring ?? true,
    },
  });

  return NextResponse.json(character, { status: 201 });
}
