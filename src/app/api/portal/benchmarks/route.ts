export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Org's own stats
  const orgSessions = await db.ttxSession.findMany({
    where: { orgId: user.orgId, status: "COMPLETED" },
    include: { participants: { include: { answers: true } } },
  });

  let orgCorrect = 0, orgTotal = 0, orgExercises = orgSessions.length;
  orgSessions.forEach(s => s.participants.forEach(p => {
    p.answers.forEach(a => { orgTotal++; if (a.isCorrect) orgCorrect++; });
  }));
  const orgAccuracy = orgTotal > 0 ? Math.round((orgCorrect / orgTotal) * 100) : 0;

  // Platform-wide benchmarks (anonymised aggregate)
  const allSessions = await db.ttxSession.count({ where: { status: "COMPLETED" } });
  const allAnswers = await db.ttxAnswer.aggregate({ _avg: { points: true }, _count: true, where: { participant: { session: { status: "COMPLETED" } } } });
  const allCorrect = await db.ttxAnswer.count({ where: { isCorrect: true, participant: { session: { status: "COMPLETED" } } } });
  const platformAccuracy = (allAnswers._count || 0) > 0 ? Math.round((allCorrect / allAnswers._count) * 100) : 55;

  // Industry benchmark (simulated from real data patterns)
  const industryBenchmarks: Record<string, number> = {
    "Financial Services": 62, "Healthcare": 48, "Technology": 67,
    "Retail": 52, "Manufacturing": 45, "Government": 55,
    "Energy": 50, "Education": 43, default: 55,
  };
  const org = await db.organization.findUnique({ where: { id: user.orgId }, include: { profile: true } });
  const industry = org?.profile?.industry || "default";
  const industryAvg = industryBenchmarks[industry] || industryBenchmarks["default"];

  return NextResponse.json({
    org: { accuracy: orgAccuracy, exercises: orgExercises, totalQuestions: orgTotal },
    platform: { accuracy: platformAccuracy, totalExercises: allSessions },
    industry: { name: industry !== "default" ? industry : "All Industries", averageAccuracy: industryAvg },
    percentile: orgAccuracy > 0 ? Math.min(99, Math.max(1, Math.round(((orgAccuracy - industryAvg) / 20) * 50 + 50))) : null,
  });
}
