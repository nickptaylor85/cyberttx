export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

// Branding stored in OrgProfile.additionalContext as BRANDING:{base64 JSON}

function getBranding(ctx: string | null): any {
  const match = (ctx || "").match(/BRANDING:([^\s]+)/);
  if (!match) return null;
  try { return JSON.parse(Buffer.from(match[1], "base64").toString()); } catch { return null; }
}

function setBranding(ctx: string | null, branding: any): string {
  const encoded = Buffer.from(JSON.stringify(branding)).toString("base64");
  const clean = (ctx || "").replace(/BRANDING:[^\s]*/, "").trim();
  return `BRANDING:${encoded} ${clean}`.trim();
}

// GET — load branding
export async function GET() {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await db.orgProfile.findUnique({ where: { orgId: user.orgId }, select: { additionalContext: true } });
  const branding = getBranding(profile?.additionalContext || null);

  return NextResponse.json(branding || { portalName: "", logoUrl: "", primaryColor: "#14b89a" });
}

// PUT — save branding
export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "CLIENT_ADMIN" && user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { portalName, logoUrl, primaryColor } = await req.json();
  const branding = { portalName: portalName || "", logoUrl: logoUrl || "", primaryColor: primaryColor || "#14b89a" };

  const profile = await db.orgProfile.findUnique({ where: { orgId: user.orgId }, select: { additionalContext: true } });
  if (profile) {
    await db.orgProfile.update({
      where: { orgId: user.orgId },
      data: { additionalContext: setBranding(profile.additionalContext, branding) },
    });
  } else {
    await db.orgProfile.create({
      data: { orgId: user.orgId, additionalContext: setBranding(null, branding) },
    });
  }

  return NextResponse.json({ success: true });
}
