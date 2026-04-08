export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Compile all personal data (GDPR Article 15 — Right of Access)
  const fullUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true, email: true, firstName: true, lastName: true, role: true,
      createdAt: true, updatedAt: true, isActive: true,
      organization: { select: { name: true, slug: true, plan: true } },
    },
  });

  const participations = await db.ttxParticipant.findMany({
    where: { userId: user.id },
    include: {
      answers: { select: { questionIndex: true, selectedOption: true, isCorrect: true, timeToAnswer: true } },
      session: { select: { title: true, theme: true, difficulty: true, createdAt: true } },
    },
  });

  let playbooks: any[] = [];
  try { playbooks = await db.$queryRawUnsafe(`SELECT id, title, theme, created_at FROM saved_playbooks WHERE user_id = $1`, user.id) as any[]; } catch {}

  let certificates: any[] = [];
  try { certificates = await db.$queryRawUnsafe(`SELECT id, title, grade, accuracy, created_at, expires_at FROM user_certificates WHERE user_id = $1`, user.id) as any[]; } catch {}

  let duels: any[] = [];
  try { duels = await db.$queryRawUnsafe(`SELECT id, theme, status, challenger_score, opponent_score, created_at FROM duels WHERE challenger_id = $1 OR opponent_id = $1`, user.id) as any[]; } catch {}

  const report = {
    exportDate: new Date().toISOString(),
    gdprArticle: "Article 15 — Right of Access",
    personalData: fullUser,
    exerciseHistory: participations.map(p => ({
      exercise: p.session.title,
      theme: p.session.theme,
      difficulty: p.session.difficulty,
      score: p.totalScore,
      date: p.session.createdAt,
      answers: p.answers,
    })),
    playbooks,
    certificates,
    duels,
    dataProcessing: {
      purpose: "Cybersecurity training and compliance tracking",
      legalBasis: "Legitimate interest + consent",
      retention: "Data retained while account is active. Deleted within 30 days of account deletion.",
      thirdParties: [
        "Anthropic (AI scenario generation — no personal data shared)",
        "Neon (PostgreSQL database hosting — EU-available)",
        "Vercel (application hosting)",
        "Resend (transactional email delivery)",
        "Pusher (real-time WebSocket connections)",
      ],
    },
  };

  return new NextResponse(JSON.stringify(report, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename=threatcast-gdpr-export-${new Date().toISOString().slice(0, 10)}.json`,
    },
  });
}
