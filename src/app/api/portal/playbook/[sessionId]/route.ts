export const dynamic = "force-dynamic";
export const maxDuration = 60;
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { sessionId } = await params;
  const session = await db.ttxSession.findFirst({
    where: { id: sessionId, orgId: user.orgId },
    select: { title: true, theme: true, scenario: true },
  });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const scenario = session.scenario as any;
  if (!scenario?.stages) return NextResponse.json({ error: "No scenario data" }, { status: 400 });

  // Generate playbook from the scenario data directly (no AI call needed)
  const stages = scenario.stages || [];
  const playbook = {
    title: `Incident Response Playbook: ${session.title}`,
    generatedFrom: session.title,
    theme: session.theme,
    sections: [
      {
        title: "1. Detection & Identification",
        content: stages[0]?.narrative || "Initial detection of the incident.",
        actions: stages[0]?.questions?.map((q: any) => {
          const correct = q.options?.find((o: any) => o.isCorrect);
          return `${q.question} → ${correct?.text || "See exercise for answer"}`;
        }) || [],
      },
      {
        title: "2. Containment",
        content: stages[1]?.narrative || "Contain the threat to prevent spread.",
        actions: stages[1]?.questions?.map((q: any) => {
          const correct = q.options?.find((o: any) => o.isCorrect);
          return `${q.question} → ${correct?.text || "See exercise for answer"}`;
        }) || [],
      },
      {
        title: "3. Eradication & Recovery",
        content: stages[2]?.narrative || "Remove the threat and restore systems.",
        actions: stages[2]?.questions?.map((q: any) => {
          const correct = q.options?.find((o: any) => o.isCorrect);
          return `${q.question} → ${correct?.text || "See exercise for answer"}`;
        }) || [],
      },
      ...(stages.slice(3).map((s: any, i: number) => ({
        title: `${i + 4}. ${s.title || "Additional Steps"}`,
        content: s.narrative || "",
        actions: s.questions?.map((q: any) => {
          const correct = q.options?.find((o: any) => o.isCorrect);
          return `${q.question} → ${correct?.text || ""}`;
        }) || [],
      }))),
    ],
    mitreTechniques: scenario.mitreAttackIds || [],
  };

  return NextResponse.json(playbook);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  return POST(req, { params });
}
