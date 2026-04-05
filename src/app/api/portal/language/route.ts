export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

// GET — return org language
export async function GET() {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ language: "en" });
  const org = await db.organization.findUnique({ where: { id: user.orgId }, select: { id: true } });
  // Language stored as JSON in a simple approach since we can't migrate schema
  const profile = await (db as any).orgProfile?.findUnique?.({ where: { orgId: user.orgId } }).catch(() => null);
  const language = (profile as any)?.additionalContext?.match?.(/LANG:(\w+)/)?.[1] || "en";
  return NextResponse.json({ language });
}

// PUT — set org language
export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { language } = await req.json();
  if (!language) return NextResponse.json({ error: "Missing language" }, { status: 400 });

  // Store language in additionalContext field (no schema migration needed)
  const existing = await (db as any).orgProfile?.findUnique?.({ where: { orgId: user.orgId } }).catch(() => null);
  if (existing) {
    const ctx = ((existing as any).additionalContext || "").replace(/LANG:\w+/, "").trim();
    await db.orgProfile.update({ where: { orgId: user.orgId }, data: { additionalContext: `LANG:${language} ${ctx}`.trim() } });
  } else {
    await db.orgProfile.create({ data: { orgId: user.orgId, additionalContext: `LANG:${language}` } });
  }
  return NextResponse.json({ success: true, language });
}
