export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const org = await db.organization.findUnique({ where: { slug: "__platform__" } });
    if (!org) return NextResponse.json({ signupsEnabled: true });
    const profile = await db.orgProfile.findUnique({ where: { orgId: org.id }, select: { additionalContext: true } });
    const match = (profile?.additionalContext || "").match(/SETTINGS:({[^}]*})/);
    const settings = match ? JSON.parse(match[1]) : {};
    // Admin stores signupsDisabled: true/false
    return NextResponse.json({ signupsEnabled: !settings.signupsDisabled });
  } catch {
    return NextResponse.json({ signupsEnabled: true });
  }
}
