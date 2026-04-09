export const maxDuration = 10;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { checkExerciseLimit } from "@/lib/plan-limits";
import { waitUntil } from "@vercel/functions";


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

  // Clean stuck sessions
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

  // Fire-and-forget to /run — a SEPARATE serverless function
  const host = req.headers.get("host") || "threatcast.io";
  const protocol = host.includes("localhost") ? "http" : "https";

  // waitUntil keeps the function alive AFTER response to complete the outgoing fetch.
  // The AI work happens in /run (its own 300s function). This just sends the request.
  waitUntil(
    fetch(protocol + "://" + host + "/api/ttx/generate/run", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-cron-secret": process.env.CRON_SECRET || "" },
    body: JSON.stringify({
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
    }),
  }).then(() => console.log("[generate] /run request sent")).catch(e => console.error("[generate] /run fire failed:", e?.message))
  );

  return NextResponse.json({ id: session.id, status: "GENERATING" });
}
