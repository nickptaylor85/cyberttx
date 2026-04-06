import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

// Profanity/adult content filter
const BLOCKED_WORDS = [
  // Profanity
  "fuck", "shit", "cunt", "bitch", "bastard", "asshole", "dick", "cock", "pussy",
  "whore", "slut", "fag", "nigger", "retard", "rape",
  // Adult/inappropriate themes
  "nude", "naked", "sexual", "pornograph", "erotic", "fetish", "bondage",
  "incest", "pedoph", "molest",
  // Violence glorification
  "murder", "torture", "genocide", "terroris",
];

function containsBlockedContent(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some(w => lower.includes(w));
}

function validateCharacter(data: any): string | null {
  const fieldsToCheck = [data.name, data.role, data.department, data.description, ...(data.expertise || [])];
  for (const field of fieldsToCheck) {
    if (typeof field === "string" && containsBlockedContent(field)) {
      return "Character contains inappropriate content. Please keep descriptions professional.";
    }
  }
  if (data.name && data.name.length > 100) return "Name too long (max 100 characters)";
  if (data.description && data.description.length > 500) return "Description too long (max 500 characters)";
  return null;
}

export async function GET() {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Return ALL characters for the org (shared across all users in the portal)
  const characters = await db.ttxCharacter.findMany({
    where: { orgId: user.orgId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(characters);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, role, department, description, expertise, isRecurring } = await req.json();
  if (!name || !role) return NextResponse.json({ error: "Name and role required" }, { status: 400 });

  // Content filter
  const filterError = validateCharacter({ name, role, department, description, expertise });
  if (filterError) return NextResponse.json({ error: filterError }, { status: 400 });

  const character = await db.ttxCharacter.create({
    data: {
      orgId: user.orgId, name, role,
      department: department || null,
      description: description || null,
      expertise: expertise || [],
      isRecurring: isRecurring ?? true,
    },
  });
  return NextResponse.json(character, { status: 201 });
}
