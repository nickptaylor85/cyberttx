import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import type { TtxScenario } from "@/types";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;

  const session = await db.ttxSession.findUnique({ where: { id: sessionId } });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // TENANT ISOLATION
  if (user.role !== "SUPER_ADMIN" && session.orgId !== user.orgId) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const updated = await db.ttxSession.update({
    where: { id: sessionId },
    data: { status: "COMPLETED", completedAt: new Date() },
    include: {
      participants: {
        include: { user: { select: { firstName: true, lastName: true } }, answers: true },
        orderBy: { totalScore: "desc" },
      },
    },
  });

  // Update ranks
  for (let i = 0; i < updated.participants.length; i++) {
    await db.ttxParticipant.update({ where: { id: updated.participants[i].id }, data: { rank: i + 1 } });
  }

  // Save feedback for AI learning
  try {
    const scenario = session.scenario as unknown as TtxScenario;
    const allAnswers = updated.participants.flatMap(p => p.answers);
    const totalCorrect = allAnswers.filter(a => a.isCorrect).length;
    const avgPercent = allAnswers.length > 0 ? (totalCorrect / allAnswers.length) * 100 : 0;

    await db.scenarioFeedback.create({
      data: {
        orgId: session.orgId, sessionId,
        avgScorePercent: avgPercent,
        themesUsed: session.theme ? [session.theme] : [],
        mitreUsed: session.mitreAttackIds || [],
        difficultyUsed: session.difficulty,
      },
    });
  } catch {}

  // Email portal admins with results
  if (process.env.RESEND_API_KEY && session.orgId) {
    try {
      const admins = await db.user.findMany({
        where: { orgId: session.orgId, role: { in: ["CLIENT_ADMIN", "SUPER_ADMIN"] } },
        select: { email: true },
      });
      const participant = updated.participants[0];
      const answers = participant?.answers || [];
      const correct = answers.filter(a => a.isCorrect).length;
      const accuracy = answers.length > 0 ? Math.round((correct / answers.length) * 100) : 0;
      const playerName = `${participant?.user?.firstName || ""} ${participant?.user?.lastName || ""}`.trim() || "A team member";

      for (const admin of admins) {
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "ThreatCast <onboarding@resend.dev>",
            to: [admin.email],
            subject: `Exercise completed: ${session.title} (${accuracy}%)`,
            html: `<div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto;padding:40px 20px;">
              <div style="font-size:20px;font-weight:700;margin-bottom:24px;">Threat<span style="color:#14b89a;">Cast</span></div>
              <h2 style="font-size:18px;">Exercise Completed</h2>
              <p><strong>${playerName}</strong> completed <strong>${session.title}</strong></p>
              <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0;">
                <p style="margin:4px 0;"><strong>Score:</strong> ${accuracy}% (${correct}/${answers.length} correct)</p>
                <p style="margin:4px 0;"><strong>Theme:</strong> ${session.theme}</p>
                <p style="margin:4px 0;"><strong>Difficulty:</strong> ${session.difficulty}</p>
              </div>
              <a href="https://threatcast.io/portal/performance" style="display:inline-block;background:#14b89a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">View Results →</a>
            </div>`,
          }),
        }).catch(() => {});
      }
    } catch {}
  }

  return NextResponse.json({ success: true });
}
