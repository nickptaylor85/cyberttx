export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

// Platform settings stored in a special org with slug "__platform__"
async function ensurePlatformOrg() {
  let org = await db.organization.findUnique({ where: { slug: "__platform__" } });
  if (!org) {
    org = await db.organization.create({
      data: { name: "Platform Settings", slug: "__platform__", plan: "ENTERPRISE" as any, maxUsers: 0, maxTtxPerMonth: 0 },
    });
    await db.orgProfile.create({ data: { orgId: org.id, additionalContext: "SETTINGS:{}" } });
  }
  return org;
}

async function getSettings(): Promise<Record<string, any>> {
  const org = await ensurePlatformOrg();
  const profile = await db.orgProfile.findUnique({ where: { orgId: org.id }, select: { additionalContext: true } });
  const match = (profile?.additionalContext || "").match(/SETTINGS:({[^}]*})/);
  try { return match ? JSON.parse(match[1]) : {}; } catch { return {}; }
}

async function saveSettings(settings: Record<string, any>) {
  const org = await ensurePlatformOrg();
  const profile = await db.orgProfile.findUnique({ where: { orgId: org.id }, select: { additionalContext: true } });
  const ctx = (profile?.additionalContext || "").replace(/SETTINGS:{[^}]*}/, "").trim();
  const newCtx = `SETTINGS:${JSON.stringify(settings)} ${ctx}`.trim();
  await db.orgProfile.update({ where: { orgId: org.id }, data: { additionalContext: newCtx } });
}

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await getSettings());
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const updates = await req.json();
  const current = await getSettings();
  const merged = { ...current, ...updates };
  await saveSettings(merged);
  return NextResponse.json({ success: true, settings: merged });
}
