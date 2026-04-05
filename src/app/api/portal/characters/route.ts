import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const characters = await db.ttxCharacter.findMany({
    where: { orgId: user.orgId }, // ORG-SCOPED
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(characters);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, role, department, description, expertise, isRecurring } = await req.json();
  if (!name || !role) return NextResponse.json({ error: "Name and role required" }, { status: 400 });
  const character = await db.ttxCharacter.create({
    data: {
      orgId: user.orgId, name, role,
      department: department || null, description: description || null,
      expertise: expertise || [], isRecurring: isRecurring ?? true,
    },
  });
  return NextResponse.json(character, { status: 201 });
}
