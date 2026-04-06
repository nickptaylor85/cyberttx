export const dynamic = "force-dynamic";
export const maxDuration = 30;
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { fetchAlerts } from "@/lib/connectors/fetchers";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get connector configs
  const profile = await db.orgProfile.findUnique({ where: { orgId: user.orgId }, select: { additionalContext: true } });
  const match = (profile?.additionalContext || "").match(/CONNECTORS:([^\s]+)/);
  if (!match) return NextResponse.json({ alerts: [], connectors: 0 });

  let connectors: any[] = [];
  try { connectors = JSON.parse(Buffer.from(match[1], "base64").toString()); } catch { return NextResponse.json({ alerts: [], connectors: 0 }); }

  const enabledConnectors = connectors.filter(c => c.enabled);
  if (enabledConnectors.length === 0) return NextResponse.json({ alerts: [], connectors: 0 });

  // Fetch from all connectors in parallel
  const results = await Promise.allSettled(enabledConnectors.map(c => fetchAlerts(c, 10)));

  const allAlerts = results.flatMap((r, i) => {
    if (r.status === "fulfilled") return r.value;
    console.error(`[alerts] ${enabledConnectors[i].type} failed:`, r.reason?.message);
    return [];
  });

  // Sort by timestamp desc
  allAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return NextResponse.json({ alerts: allAlerts.slice(0, 50), connectors: enabledConnectors.length });
}
