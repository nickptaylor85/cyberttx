export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

const ALL_FLAGS = [
  { id: "multiplayer", label: "Real-Time Multiplayer", desc: "Group exercises with live scoring" },
  { id: "siem_integration", label: "SIEM/XDR Integration", desc: "Connect external security tools" },
  { id: "custom_branding", label: "Custom Branding", desc: "Logo, name, colours" },
  { id: "playbook_export", label: "Playbook Export", desc: "PDF and Word playbook downloads" },
  { id: "certificate_pdf", label: "Certificate PDFs", desc: "Downloadable certificate documents" },
  { id: "compliance", label: "Compliance Evidence", desc: "Framework mapping and evidence" },
  { id: "benchmarks", label: "Benchmarks", desc: "Compare against platform averages" },
  { id: "mitre_coverage", label: "MITRE Coverage", desc: "ATT&CK technique heatmap" },
  { id: "api_access", label: "API Access", desc: "Programmatic access via API keys" },
  { id: "sso", label: "SSO / SAML", desc: "Single sign-on integration" },
  { id: "weekly_reports", label: "Weekly Email Reports", desc: "Automated weekly digest" },
  { id: "slack_bot", label: "Slack Bot", desc: "Slash commands for exercises" },
  { id: "i18n", label: "Multi-Language", desc: "Exercise generation in 12 languages" },
  { id: "custom_characters", label: "Custom Characters", desc: "Named recurring characters" },
];

function getFlags(ctx: string | null): Record<string, boolean> {
  const match = (ctx || "").match(/FLAGS:({[^}]*})/);
  try { return match ? JSON.parse(match[1]) : {}; } catch { return {}; }
}

function setFlags(ctx: string | null, flags: Record<string, boolean>): string {
  const clean = (ctx || "").replace(/FLAGS:{[^}]*}/, "").trim();
  return `FLAGS:${JSON.stringify(flags)} ${clean}`.trim();
}

// GET — get flags for an org
export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const orgId = req.nextUrl.searchParams.get("orgId");
  if (!orgId) return NextResponse.json({ allFlags: ALL_FLAGS });

  const profile = await db.orgProfile.findUnique({ where: { orgId }, select: { additionalContext: true } });
  const flags = getFlags(profile?.additionalContext || null);

  return NextResponse.json({
    allFlags: ALL_FLAGS,
    enabled: flags,
    orgId,
  });
}

// PUT — update flags for an org
export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { orgId, flags } = await req.json();
  if (!orgId || !flags) return NextResponse.json({ error: "orgId and flags required" }, { status: 400 });

  const profile = await db.orgProfile.findUnique({ where: { orgId }, select: { additionalContext: true } });
  const newCtx = setFlags(profile?.additionalContext || null, flags);
  await db.orgProfile.update({ where: { orgId }, data: { additionalContext: newCtx } });

  return NextResponse.json({ success: true, flags });
}
