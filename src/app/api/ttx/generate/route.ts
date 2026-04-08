export const maxDuration = 10;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { checkExerciseLimit } from "@/lib/plan-limits";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  const { theme, difficulty, mode, questionCount, mitreAttackIds, selectedCharacters, customIncident, language, threatActorId } = body;

  // Create session immediately
  const session = await db.ttxSession.create({
    data: {
      orgId: org.id, title: "Generating...", difficulty, theme,
      mitreAttackIds: mitreAttackIds || [], mode: mode || "GROUP",
      status: "GENERATING", questionCount: questionCount || 10,
      createdById: user.id, channelName: null,
    },
  });

  // Fire-and-forget: trigger the actual generation via internal API call
  const host = req.headers.get("host") || "threatcast.io";
  const protocol = host.includes("localhost") ? "http" : "https";
  
  fetch(`${protocol}://${host}/api/ttx/generate/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-internal-secret": process.env.CRON_SECRET || "" },
    body: JSON.stringify({
      sessionId: session.id,
      orgId: org.id,
      orgName: org.name,
      userId: user.id,
      userEmail: user.email,
      theme, difficulty, mode,
      questionCount: questionCount || 10,
      mitreAttackIds: mitreAttackIds || [],
      characters: (selectedCharacters || []).map((c: any) => ({
        name: c.name, role: c.role, department: c.department || undefined,
        description: c.description || undefined, expertise: c.expertise || [],
      })),
      securityTools: org.securityTools.map(ost => ({
        name: ost.tool.name, vendor: ost.tool.vendor, category: ost.tool.category,
      })),
      orgProfile: org.profile || null,
      customIncident, language, threatActorId,
    }),
  }).catch(() => {}); // Fire and forget

  // Return immediately — client will poll
  return NextResponse.json({ id: session.id, status: "GENERATING" });
}
