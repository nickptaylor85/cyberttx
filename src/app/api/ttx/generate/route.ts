import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { generateTtxScenario, analyzePastPerformance } from "@/lib/ai/generate-ttx";
import { generateChannelName } from "@/lib/utils";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user?.orgId) {
    return NextResponse.json({ error: "User not in an organization" }, { status: 403 });
  }

  const org = await db.organization.findUnique({
    where: { id: user.orgId },
    include: {
      securityTools: { include: { tool: true } },
      profile: true,
      characters: { where: { isRecurring: true } },
    },
  });

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  // Check TTX limits
  if (org.ttxUsedThisMonth >= org.maxTtxPerMonth && !org.isDemo) {
    return NextResponse.json(
      { error: `Monthly TTX limit reached (${org.maxTtxPerMonth}). Upgrade your plan.` },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { theme, difficulty, mode, questionCount, mitreAttackIds, timeLimitSecs, additionalCharacters } = body;

  if (!theme || !difficulty) {
    return NextResponse.json({ error: "Theme and difficulty required" }, { status: 400 });
  }

  // Merge recurring characters with any session-specific ones
  const allCharacters = [
    ...org.characters.map((c) => ({
      name: c.name,
      role: c.role,
      department: c.department || undefined,
      description: c.description || undefined,
      expertise: c.expertise || [],
    })),
    ...(additionalCharacters || []),
  ];

  // Analyze past performance for adaptive difficulty
  const pastPerformance = await analyzePastPerformance(org.id, db);

  // Create session in GENERATING state
  const session = await db.ttxSession.create({
    data: {
      orgId: org.id,
      title: "Generating...",
      difficulty,
      theme,
      mitreAttackIds: mitreAttackIds || [],
      mode: mode || "GROUP",
      status: "GENERATING",
      questionCount: questionCount || 12,
      timeLimitSecs: timeLimitSecs || null,
      createdById: user.id,
      channelName: generateChannelName("pending"),
    },
  });

  try {
    // Generate scenario with full context
    const scenario = await generateTtxScenario({
      theme,
      difficulty,
      mitreAttackIds: mitreAttackIds || [],
      securityTools: org.securityTools.map((ost) => ({
        name: ost.tool.name,
        vendor: ost.tool.vendor,
        category: ost.tool.category,
      })),
      questionCount: questionCount || 12,
      orgProfile: org.profile,
      characters: allCharacters,
      pastPerformance,
    });

    // Update session with generated scenario
    const channelName = generateChannelName(session.id);
    const updatedSession = await db.ttxSession.update({
      where: { id: session.id },
      data: {
        title: scenario.title,
        scenario: scenario as any,
        status: mode === "INDIVIDUAL" ? "IN_PROGRESS" : "LOBBY",
        channelName,
      },
    });

    // Auto-join creator as participant
    await db.ttxParticipant.create({
      data: { sessionId: session.id, userId: user.id },
    });

    // Increment monthly usage
    await db.organization.update({
      where: { id: org.id },
      data: { ttxUsedThisMonth: { increment: 1 } },
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    await db.ttxSession.update({
      where: { id: session.id },
      data: { status: "CANCELLED" },
    });
    console.error("TTX generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate scenario. Please try again." },
      { status: 500 }
    );
  }
}
