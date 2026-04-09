export const maxDuration = 10;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { checkExerciseLimit } from "@/lib/plan-limits";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 10 generations per hour per user
  const rl = rateLimit("generate:" + user.id, 10, 60 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });

  const org = await db.organization.findUnique({
    where: { id: user.orgId },
    include: { securityTools: { include: { tool: true } }, profile: true },
  });
  if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

  // Plan enforcement
  const planCheck = await checkExerciseLimit(org.id);
  if (!planCheck.allowed) {
    return NextResponse.json({ error: `Monthly exercise limit reached (${planCheck.used}/${planCheck.limit}).` }, { status: 429 });
  }

  // Clean up stuck sessions
  await db.ttxSession.updateMany({
    where: { createdById: user.id, status: "GENERATING", createdAt: { lt: new Date(Date.now() - 5 * 60 * 1000) } },
    data: { status: "CANCELLED" },
  });

  const body = await req.json();
  const { theme, difficulty, mode, questionCount, mitreAttackIds, selectedCharacters, customIncident, language } = body;

  // Create session immediately
  const session = await db.ttxSession.create({
    data: {
      orgId: org.id, title: "Generating...", difficulty, theme,
      mitreAttackIds: mitreAttackIds || [], mode: mode || "GROUP",
      status: "GENERATING", questionCount: questionCount || 12,
      createdById: user.id, channelName: null,
    },
  });

  const host = req.headers.get("host") || "threatcast.io";
  const protocol = host.includes("localhost") ? "http" : "https";
  const runUrl = `${protocol}://${host}/api/ttx/generate/run`;
  const secret = process.env.CRON_SECRET || "";
  console.log(`[generate] Firing /run at ${runUrl}, secret present: ${!!secret}`);

  fetch(runUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-cron-secret": secret },
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
      securityTools: org.securityTools.map(ost => ({
        name: ost.tool.name, vendor: ost.tool.vendor, category: ost.tool.category,
      })),
      orgProfile: org.profile || null,
      customIncident, language,
    }),
  }).catch(e => console.error("[generate] Failed to fire /run:", e?.message));

  // Return immediately — client redirects to session page which polls
  return NextResponse.json({ id: session.id, status: "GENERATING" });
}
