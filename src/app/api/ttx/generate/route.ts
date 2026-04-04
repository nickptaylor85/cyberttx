import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { generateTtxScenario, analyzePastPerformance } from "@/lib/ai/generate-ttx";
import { generateChannelName } from "@/lib/utils";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await getOrCreateUser();
  if (!user?.orgId) return NextResponse.json({ error: "Not in an organization" }, { status: 403 });

  const org = await db.organization.findUnique({
    where: { id: user.orgId },
    include: { securityTools: { include: { tool: true } }, profile: true },
  });
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  if (org.ttxUsedThisMonth >= org.maxTtxPerMonth && !org.isDemo) {
    return NextResponse.json({ error: `Monthly limit reached (${org.maxTtxPerMonth}).` }, { status: 429 });
  }

  const body = await req.json();
  const { theme, difficulty, mode, questionCount, mitreAttackIds, timeLimitSecs, selectedCharacters } = body;
  if (!theme || !difficulty) return NextResponse.json({ error: "Theme and difficulty required" }, { status: 400 });

  const characters = (selectedCharacters || []).map((c: any) => ({
    name: c.name, role: c.role, department: c.department || undefined,
    description: c.description || undefined, expertise: c.expertise || [],
  }));

  const pastPerformance = await analyzePastPerformance(org.id, db);

  const session = await db.ttxSession.create({
    data: {
      orgId: org.id, title: "Generating...", difficulty, theme,
      mitreAttackIds: mitreAttackIds || [], mode: mode || "GROUP",
      status: "GENERATING", questionCount: questionCount || 12,
      timeLimitSecs: timeLimitSecs || null, createdById: user.id,
      channelName: generateChannelName("pending"),
    },
  });

  try {
    const scenario = await generateTtxScenario({
      theme, difficulty, mitreAttackIds: mitreAttackIds || [],
      securityTools: org.securityTools.map((ost) => ({ name: ost.tool.name, vendor: ost.tool.vendor, category: ost.tool.category })),
      questionCount: questionCount || 12,
      orgProfile: org.profile as any, characters, pastPerformance,
    });

    const channelName = generateChannelName(session.id);
    const updatedSession = await db.ttxSession.update({
      where: { id: session.id },
      data: { title: scenario.title, scenario: scenario as any, status: mode === "INDIVIDUAL" ? "IN_PROGRESS" : "LOBBY", channelName },
    });

    await db.ttxParticipant.create({ data: { sessionId: session.id, userId: user.id } });
    await db.organization.update({ where: { id: org.id }, data: { ttxUsedThisMonth: { increment: 1 } } });

    return NextResponse.json(updatedSession);
  } catch (error) {
    await db.ttxSession.update({ where: { id: session.id }, data: { status: "CANCELLED" } });
    console.error("TTX generation error:", error);
    return NextResponse.json({ error: "Failed to generate scenario. Please try again." }, { status: 500 });
  }
}
