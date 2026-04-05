import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { generatePlaybook } from "@/lib/ai/generate-playbook";
import type { TtxScenario } from "@/types";

export const maxDuration = 60;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "No org" }, { status: 403 });

  const { sessionId } = await params;

  // Check if playbook already exists
  const existing = await (db.playbook.findFirst as any)({ where: { sessionId } });
  if (existing) return NextResponse.json(existing);

  const session = await db.ttxSession.findUnique({
    where: { id: sessionId },
    include: {
      organization: { include: { securityTools: { include: { tool: true } }, profile: true } },
      participants: { include: { answers: true } },
    },
  });

  if (!session || session.orgId !== user.orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (session.status !== "COMPLETED") {
    return NextResponse.json({ error: "TTX must be completed first" }, { status: 400 });
  }

  const scenario = session.scenario as unknown as TtxScenario;
  const allAnswers = session.participants.flatMap((p) => p.answers);
  const totalCorrect = allAnswers.filter((a) => a.isCorrect).length;
  const avgPercent = allAnswers.length > 0 ? (totalCorrect / allAnswers.length) * 100 : 0;

  // Identify weak areas from wrong answers
  const wrongByPhase: Record<string, number> = {};
  const correctByPhase: Record<string, number> = {};
  allAnswers.forEach((a) => {
    const stage = scenario.stages[a.stageIndex];
    if (!stage) return;
    const phase = stage.mitrePhase;
    if (a.isCorrect) correctByPhase[phase] = (correctByPhase[phase] || 0) + 1;
    else wrongByPhase[phase] = (wrongByPhase[phase] || 0) + 1;
  });

  const weakAreas = Object.entries(wrongByPhase).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
  const strongAreas = Object.entries(correctByPhase).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);

  try {
    const content = await generatePlaybook({
      scenario,
      orgProfile: session.organization.profile,
      securityTools: session.organization.securityTools.map((t) => t.tool.name),
      performanceData: { avgScorePercent: Math.round(avgPercent), weakAreas, strongAreas },
      framework: "NIST",
    });

    const playbook = await (db.playbook.create as any)({
      data: {
        sessionId,
        orgId: user.orgId,
        title: content.title || `${scenario.title} - Playbook`,
        content,
        framework: "NIST",
        threatType: session.theme,
      },
    });

    return NextResponse.json(playbook);
  } catch (e) {
    console.error("Playbook generation error:", e);
    return NextResponse.json({ error: "Failed to generate playbook" }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "No org" }, { status: 403 });

  const { sessionId } = await params;
  const playbook = await db.playbook.findFirst({ where: { sessionId } });
  if (!playbook || playbook.orgId !== user.orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(playbook);
}
