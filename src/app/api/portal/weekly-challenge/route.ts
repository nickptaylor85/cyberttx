export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

const WEEKLY_THEMES = [
  { theme: "ransomware", title: "Ransomware Response Challenge" },
  { theme: "phishing", title: "Phishing Defence Challenge" },
  { theme: "apt", title: "APT Detection Challenge" },
  { theme: "insider-threat", title: "Insider Threat Challenge" },
  { theme: "supply-chain", title: "Supply Chain Attack Challenge" },
  { theme: "cloud-breach", title: "Cloud Security Challenge" },
  { theme: "data-exfil", title: "Data Protection Challenge" },
  { theme: "ddos", title: "DDoS Response Challenge" },
];

export async function GET() {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Determine this week's challenge from the week number
    const now = new Date();
    const weekNum = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
    const pick = WEEKLY_THEMES[weekNum % WEEKLY_THEMES.length];

    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    const nextMonday = new Date(monday);
    nextMonday.setDate(nextMonday.getDate() + 7);
    const daysLeft = Math.max(0, Math.ceil((nextMonday.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

    // Get exercises completed this week as "challenge attempts"
    const weekExercises = await db.ttxSession.findMany({
      where: { status: "COMPLETED", theme: pick.theme, createdAt: { gte: monday } },
      include: {
        participants: { include: { user: { select: { id: true, firstName: true } }, answers: { select: { isCorrect: true } } } },
        organization: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Build leaderboard from this week's exercises for this theme
    const userScores: Record<string, { name: string; org: string; accuracy: number; userId: string }> = {};
    weekExercises.forEach(s => {
      s.participants.forEach(p => {
        const correct = p.answers.filter(a => a.isCorrect).length;
        const total = p.answers.length;
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
        const existing = userScores[p.userId];
        if (!existing || accuracy > existing.accuracy) {
          userScores[p.userId] = { name: p.user.firstName || "User", org: s.organization?.name || "", accuracy, userId: p.userId };
        }
      });
    });

    const leaderboard = Object.values(userScores)
      .sort((a, b) => b.accuracy - a.accuracy)
      .map((entry, i) => ({ rank: i + 1, name: entry.name, org: entry.org, accuracy: entry.accuracy, isYou: entry.userId === user.id }));

    const myAttempt = leaderboard.find(e => e.isYou);

    return NextResponse.json({
      challenge: { id: `week-${weekNum}`, week_start: monday.toISOString().split("T")[0], theme: pick.theme, title: pick.title, difficulty: "INTERMEDIATE" },
      leaderboard,
      myAttempt: myAttempt ? { accuracy: myAttempt.accuracy } : null,
      daysLeft,
      totalAttempts: leaderboard.length,
    });
  } catch (e: any) {
    console.error("[weekly-challenge] Error:", e.message);
    return NextResponse.json({
      challenge: { id: "fallback", week_start: new Date().toISOString().split("T")[0], theme: "ransomware", title: "Ransomware Response Challenge", difficulty: "INTERMEDIATE" },
      leaderboard: [], myAttempt: null, daysLeft: 7, totalAttempts: 0,
    });
  }
}
