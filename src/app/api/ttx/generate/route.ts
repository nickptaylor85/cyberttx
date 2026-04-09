export const maxDuration = 300;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { after } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { checkExerciseLimit } from "@/lib/plan-limits";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit("generate:" + user.id, 10, 60 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });

  const org = await db.organization.findUnique({
    where: { id: user.orgId },
    include: { securityTools: { include: { tool: true } }, profile: true },
  });
  if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

  const planCheck = await checkExerciseLimit(org.id);
  if (!planCheck.allowed) {
    return NextResponse.json({ error: "Monthly limit reached (" + planCheck.used + "/" + planCheck.limit + ")." }, { status: 429 });
  }

  await db.ttxSession.updateMany({
    where: { createdById: user.id, status: "GENERATING", createdAt: { lt: new Date(Date.now() - 5 * 60 * 1000) } },
    data: { status: "CANCELLED" },
  });

  const body = await req.json();
  const { theme, difficulty, mode, questionCount, mitreAttackIds, selectedCharacters, customIncident, language } = body;

  const session = await db.ttxSession.create({
    data: {
      orgId: org.id, title: "Generating...", difficulty, theme,
      mitreAttackIds: mitreAttackIds || [], mode: mode || "GROUP",
      status: "GENERATING", questionCount: questionCount || 12,
      createdById: user.id, channelName: null,
    },
  });

  console.log("[generate] Session " + session.id + " created, firing /run");

  const host = req.headers.get("host") || "threatcast.io";
  const protocol = host.includes("localhost") ? "http" : "https";
  const runUrl = protocol + "://" + host + "/api/ttx/generate/run";

  const payload = JSON.stringify({
    sessionId: session.id,
    orgId: org.id,
    orgName: org.name,
    userId: user.id,
    userEmail: user.email,
    theme, difficulty, mode,
    questionCount: questionCount || 12,
    mitreAttackIds: mitreAttackIds || [],
    characters: (selectedCharacters || []).map((c: any) => ({
      name: c.name, role: c.role, department: c.department || undefined,
      description: c.description || undefined, expertise: c.expertise || [],
    })),
    securityTools: org.securityTools.map((ost: any) => ({
      name: ost.tool.name, vendor: ost.tool.vendor, category: ost.tool.category,
    })),
    orgProfile: (org.profile || null) as any,
    customIncident,
    language,
  });

  // after() runs AFTER the response is sent to the client.
  // maxDuration=300 gives it up to 5 minutes to complete.
  // The client gets the response immediately, then after() fires /run and waits.
  after(async () => {
    try {
      console.log("[generate/after] Calling /run for " + session.id);
      const res = await fetch(runUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-cron-secret": process.env.CRON_SECRET || "" },
        body: payload,
      });
      console.log("[generate/after] /run returned " + res.status + " for " + session.id);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[generate/after] /run error body:", text.slice(0, 200));
      }
    } catch (e: any) {
      console.error("[generate/after] /run fetch failed:", e?.message);
      await db.ttxSession.update({ where: { id: session.id }, data: { status: "CANCELLED" } }).catch(() => {});
    }
  });

  return NextResponse.json({ id: session.id, status: "GENERATING" });
}
