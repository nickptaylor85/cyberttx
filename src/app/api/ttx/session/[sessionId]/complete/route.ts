import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import type { TtxScenario } from "@/types";

const LEVELS = [
  { level: 1, name: "Recruit", xp: 0 },
  { level: 2, name: "Analyst", xp: 100 },
  { level: 3, name: "Responder", xp: 300 },
  { level: 4, name: "Investigator", xp: 600 },
  { level: 5, name: "Specialist", xp: 1000 },
  { level: 6, name: "Lead", xp: 1500 },
  { level: 7, name: "Expert", xp: 2500 },
  { level: 8, name: "Senior Expert", xp: 4000 },
  { level: 9, name: "Master", xp: 6000 },
  { level: 10, name: "Elite Defender", xp: 10000 },
];

function getLevel(xp: number) {
  let level = LEVELS[0];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) { level = LEVELS[i]; break; }
  }
  return level;
}

function calcXpForSession(correct: number, total: number, difficulty: string): number {
  const accuracy = total > 0 ? correct / total : 0;
  const diffMultiplier = difficulty === "EXPERT" ? 3 : difficulty === "ADVANCED" ? 2 : difficulty === "INTERMEDIATE" ? 1.5 : 1;
  return Math.round((50 + accuracy * 50) * diffMultiplier);
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;

  const session = await db.ttxSession.findUnique({ where: { id: sessionId } });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  // ── XP + STREAK + ACHIEVEMENTS ─────────────────────────────────────────
  const myParticipant = updated.participants.find(p => {
    // participant.user isn't a full user, look up by session
    return true; // we'll match by userId below
  });

  // Get the participant for this user
  const myPart = await db.ttxParticipant.findFirst({
    where: { sessionId, userId: user.id },
    include: { answers: true },
  });

  let reward = null;
  if (myPart) {
    const correct = myPart.answers.filter(a => a.isCorrect).length;
    const total = myPart.answers.length;
    const xpEarned = calcXpForSession(correct, total, session.difficulty as string);

    // Streak logic
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const lastDate = user.streakLastDate ? user.streakLastDate.toISOString().split("T")[0] : null;

    let newStreak = 1;
    if (lastDate === today) {
      newStreak = user.streakDays; // already did one today, don't double count
    } else if (lastDate === yesterday) {
      newStreak = user.streakDays + 1; // continuing streak
    } else {
      newStreak = 1; // streak broken or first time
    }
    const newBestStreak = Math.max(newStreak, user.bestStreak);
    const prevXp = user.xpTotal;
    const newXp = prevXp + (lastDate === today ? 0 : xpEarned); // don't double-count same day repeat
    const actualXpEarned = newXp - prevXp;

    const prevLevel = getLevel(prevXp);
    const newLevel = getLevel(newXp);
    const leveledUp = newLevel.level > prevLevel.level;

    // Update user
    await db.user.update({
      where: { id: user.id },
      data: {
        xpTotal: newXp,
        streakDays: newStreak,
        bestStreak: newBestStreak,
        streakLastDate: lastDate === today ? user.streakLastDate : new Date(),
      },
    });

    // Achievement checks — calculate which ones newly unlocked this session
    const allParticipations = await db.ttxParticipant.findMany({
      where: { userId: user.id, session: { status: "COMPLETED" } },
      include: {
        answers: { select: { isCorrect: true } },
        session: { select: { theme: true, mode: true, createdById: true } },
      },
    });

    const totalCompleted = allParticipations.length;
    const perfects = allParticipations.filter(p => p.answers.length > 0 && p.answers.every(a => a.isCorrect)).length;
    const themes = new Set(allParticipations.map(p => p.session.theme).filter(Boolean));
    const isGroupSession = session.mode === "GROUP";
    const isFromAlert = false; // customIncident not stored in DB; real-world badge awarded via achievements page
    const sessionsCreatedByMeWithOthers = await db.ttxParticipant.count({
      where: { session: { createdById: user.id, status: "COMPLETED" }, userId: { not: user.id } },
    });

    const thisAccuracy = total > 0 ? correct / total : 0;
    const isPerfect = total > 0 && thisAccuracy === 1;

    const newAchievements: string[] = [];
    // Only fire achievement if it was the threshold exercise (not retroactive spam)
    if (totalCompleted === 1) newAchievements.push("first-exercise");
    if (totalCompleted === 5) newAchievements.push("five-exercises");
    if (totalCompleted === 20) newAchievements.push("twenty-exercises");
    if (totalCompleted === 50) newAchievements.push("fifty-exercises");
    if (totalCompleted === 100) newAchievements.push("hundred-exercises");
    if (isPerfect && perfects === 1) newAchievements.push("perfect-score");
    if (isPerfect && perfects === 5) newAchievements.push("five-perfects");
    if (themes.size === 3) newAchievements.push("three-themes");
    if (themes.size === 8) newAchievements.push("all-themes");
    // real-world achievement: customIncident not in schema yet — skipped
    if (isGroupSession && allParticipations.filter(p => p.session.mode === "GROUP").length === 1) newAchievements.push("team-player");
    if (sessionsCreatedByMeWithOthers >= 5) {
      const prev = await db.ttxParticipant.count({
        where: { session: { createdById: user.id, status: "COMPLETED" }, userId: { not: user.id } },
      });
      if (prev === 5) newAchievements.push("mentor"); // just crossed threshold
    }

    reward = {
      xpEarned: actualXpEarned,
      totalXp: newXp,
      leveledUp,
      level: newLevel,
      prevLevel,
      streak: newStreak,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      newAchievements,
    };
  }

  // Save feedback for AI learning
  try {
    const allAnswers = updated.participants.flatMap(p => p.answers);
    const totalCorrect = allAnswers.filter(a => a.isCorrect).length;
    await db.scenarioFeedback.create({
      data: {
        orgId: session.orgId, sessionId,
        avgScorePercent: allAnswers.length > 0 ? (totalCorrect / allAnswers.length) * 100 : 0,
        themesUsed: session.theme ? [session.theme] : [],
        mitreUsed: session.mitreAttackIds || [],
        difficultyUsed: session.difficulty,
      },
    });
  } catch {}

  // Email admins (fire and forget)
  if (process.env.RESEND_API_KEY && session.orgId) {
    try {
      const admins = await db.user.findMany({
        where: { orgId: session.orgId, role: { in: ["CLIENT_ADMIN", "SUPER_ADMIN"] } },
        select: { email: true },
      });
      const p0 = updated.participants[0];
      const answers = p0?.answers || [];
      const acc = answers.length > 0 ? Math.round((answers.filter(a => a.isCorrect).length / answers.length) * 100) : 0;
      const name = `${p0?.user?.firstName || ""} ${p0?.user?.lastName || ""}`.trim() || "A team member";
      for (const admin of admins) {
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "ThreatCast <noreply@threatcast.io>", to: [admin.email],
            subject: `Exercise completed: ${session.title} (${acc}%)`,
            html: `<div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto;padding:40px 20px;"><h2>Exercise Completed</h2><p><strong>${name}</strong> completed <strong>${session.title}</strong></p><p>Score: ${acc}% · ${session.theme} · ${session.difficulty}</p><a href="https://threatcast.io/portal/performance" style="display:inline-block;background:#14b89a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">View Results →</a></div>`,
          }),
        }).catch(() => {});
      }
    } catch {}
  }

  return NextResponse.json({ success: true, reward });
}
