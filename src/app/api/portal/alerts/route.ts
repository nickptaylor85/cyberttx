export const dynamic = "force-dynamic";
export const maxDuration = 30;
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { fetchAlerts } from "@/lib/connectors/fetchers";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await db.orgProfile.findUnique({ where: { orgId: user.orgId }, select: { additionalContext: true } });
  const match = (profile?.additionalContext || "").match(/CONNECTORS:([^\s]+)/);
  if (!match) return NextResponse.json({ alerts: [], connectors: 0, errors: [] });

  let connectors: any[] = [];
  try { connectors = JSON.parse(Buffer.from(match[1], "base64").toString()); } catch { return NextResponse.json({ alerts: [], connectors: 0, errors: ["Failed to parse connector config"] }); }

  const enabledConnectors = connectors.filter(c => c.enabled);
  if (enabledConnectors.length === 0) return NextResponse.json({ alerts: [], connectors: 0, errors: [] });

  const results = await Promise.allSettled(enabledConnectors.map(c => fetchAlerts(c, 10)));

  const allAlerts: any[] = [];
  const errors: { connector: string; error: string }[] = [];

  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      allAlerts.push(...r.value);
    } else {
      const errMsg = r.reason?.message || String(r.reason);
      errors.push({ connector: enabledConnectors[i].type, error: errMsg });
      console.error(`[alerts] ${enabledConnectors[i].type} failed:`, errMsg);
    }
  });

  allAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return NextResponse.json({
    alerts: allAlerts.slice(0, 50),
    connectors: enabledConnectors.length,
    errors,
    successCount: results.filter(r => r.status === "fulfilled").length,
  });
}
