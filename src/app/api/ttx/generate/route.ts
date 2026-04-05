export const maxDuration = 300;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { generateTtxScenario } from "@/lib/ai/generate-ttx";
import { generateChannelName } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await db.organization.findUnique({
    where: { id: user.orgId },
    include: { securityTools: { include: { tool: true } }, profile: true },
  });
  if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

  if (org.ttxUsedThisMonth >= org.maxTtxPerMonth && !org.isDemo) {
    return NextResponse.json({ error: "Monthly limit reached." }, { status: 429 });
  }

  const pendingCount = await db.ttxSession.count({
    where: { createdById: user.id, status: "GENERATING" },
  });
  if (pendingCount > 0) {
    return NextResponse.json({ error: "Already generating a scenario. Please wait." }, { status: 429 });
  }

  const body = await req.json();
  const { theme, difficulty, mode, questionCount, mitreAttackIds, selectedCharacters } = body;

  const characters = (selectedCharacters || []).map((c: any) => ({
    name: c.name, role: c.role, department: c.department || undefined,
    description: c.description || undefined, expertise: c.expertise || [],
  }));

  // Create session immediately with GENERATING status
  const session = await db.ttxSession.create({
    data: {
      orgId: org.id, title: "Generating...", difficulty, theme,
      mitreAttackIds: mitreAttackIds || [], mode: mode || "GROUP",
      status: "GENERATING", questionCount: questionCount || 12,
      createdById: user.id, channelName: null,
    },
  });

  // Run Claude in the background — return session ID immediately
  // Session page polls /api/ttx/status every 3s for completion
  after(async () => {
    try {
      const scenario = await generateTtxScenario({
        theme, difficulty, mitreAttackIds: mitreAttackIds || [],
        securityTools: org.securityTools.map(ost => ({
          name: ost.tool.name, vendor: ost.tool.vendor, category: ost.tool.category,
        })),
        questionCount: questionCount || 12,
        orgProfile: org.profile as any, characters, pastPerformance: null,
      });

      await db.ttxSession.update({
        where: { id: session.id },
        data: {
          title: scenario.title, scenario: scenario as any,
          status: mode === "INDIVIDUAL" ? "IN_PROGRESS" : "LOBBY",
          channelName: generateChannelName(session.id),
        },
      });

      await db.ttxParticipant.create({ data: { sessionId: session.id, userId: user.id } });
      await db.organization.update({ where: { id: org.id }, data: { ttxUsedThisMonth: { increment: 1 } } });
      console.log("[generate] Session " + session.id + " completed");
    } catch (error: any) {
      console.error("[generate] Failed:", error?.message);
      await db.ttxSession.update({ where: { id: session.id }, data: { status: "CANCELLED" } });
    }
  });

  // Return immediately — client redirects to session page which polls
  return NextResponse.json({ id: session.id, status: "GENERATING" });
}
