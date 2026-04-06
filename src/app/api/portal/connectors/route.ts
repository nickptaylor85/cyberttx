export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

// Connectors stored in OrgProfile.additionalContext as CONNECTORS:{base64 JSON}

async function getConnectors(orgId: string): Promise<any[]> {
  const profile = await db.orgProfile.findUnique({ where: { orgId }, select: { additionalContext: true } });
  const match = (profile?.additionalContext || "").match(/CONNECTORS:([^\s]+)/);
  if (!match) return [];
  try { return JSON.parse(Buffer.from(match[1], "base64").toString()); } catch { return []; }
}

async function setConnectors(orgId: string, connectors: any[]): Promise<void> {
  const encoded = Buffer.from(JSON.stringify(connectors)).toString("base64");
  const profile = await db.orgProfile.findUnique({ where: { orgId }, select: { additionalContext: true } });
  if (profile) {
    const ctx = (profile.additionalContext || "").replace(/CONNECTORS:[^\s]*/, "").trim();
    await db.orgProfile.update({ where: { orgId }, data: { additionalContext: `CONNECTORS:${encoded} ${ctx}`.trim() } });
  } else {
    await db.orgProfile.create({ data: { orgId, additionalContext: `CONNECTORS:${encoded}` } });
  }
}

// GET — list configured connectors (without secrets)
export async function GET() {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const connectors = await getConnectors(user.orgId);
  // Strip secrets
  const safe = connectors.map(c => ({
    ...c,
    credentials: Object.fromEntries(Object.entries(c.credentials).map(([k, v]) => [k, typeof v === "string" && v.length > 4 ? v.slice(0, 4) + "••••" : "••••"])),
  }));
  return NextResponse.json(safe);
}

// POST — save connector config
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId || (user.role !== "CLIENT_ADMIN" && user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  const { type, credentials } = await req.json();
  if (!type || !credentials) return NextResponse.json({ error: "type and credentials required" }, { status: 400 });

  const connectors = await getConnectors(user.orgId);
  const existing = connectors.findIndex(c => c.type === type);
  const config = { type, credentials, enabled: true, lastSyncAt: null };
  if (existing >= 0) connectors[existing] = config;
  else connectors.push(config);
  await setConnectors(user.orgId, connectors);

  return NextResponse.json({ success: true });
}

// DELETE — remove connector
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId || (user.role !== "CLIENT_ADMIN" && user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  const type = req.nextUrl.searchParams.get("type");
  if (!type) return NextResponse.json({ error: "type required" }, { status: 400 });

  const connectors = await getConnectors(user.orgId);
  await setConnectors(user.orgId, connectors.filter(c => c.type !== type));
  return NextResponse.json({ success: true });
}
