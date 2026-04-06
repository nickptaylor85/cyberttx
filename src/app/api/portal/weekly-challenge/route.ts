export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

async function ensureTable() {
  await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS weekly_challenges (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    week_start DATE NOT NULL UNIQUE,
    theme TEXT NOT NULL,
    title TEXT NOT NULL,
    difficulty TEXT DEFAULT 'INTERMEDIATE',
    session_id TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )`);
  await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS challenge_attempts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    challenge_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    org_id TEXT,
    session_id TEXT NOT NULL,
    accuracy INT DEFAULT 0,
    completed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(challenge_id, user_id)
  )`);
}

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
  await ensureTable();

  // Get current week's Monday
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);
  const weekStr = monday.toISOString().split("T")[0];

  // Check if challenge exists for this week
  let challenges = await db.$queryRawUnsafe(
    `SELECT * FROM weekly_challenges WHERE week_start = $1`, weekStr
  ) as any[];

  if (challenges.length === 0) {
    // Auto-create this week's challenge
    const weekNum = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
    const pick = WEEKLY_THEMES[weekNum % WEEKLY_THEMES.length];
    await db.$executeRawUnsafe(
      `INSERT INTO weekly_challenges (week_start, theme, title, difficulty) VALUES ($1, $2, $3, 'INTERMEDIATE')`,
      weekStr, pick.theme, pick.title
    );
    challenges = await db.$queryRawUnsafe(`SELECT * FROM weekly_challenges WHERE week_start = $1`, weekStr) as any[];
  }

  const challenge = challenges[0];

  // Get leaderboard for this challenge
  const attempts = await db.$queryRawUnsafe(
    `SELECT ca.user_id, ca.accuracy, ca.org_id, ca.completed_at FROM challenge_attempts ca WHERE ca.challenge_id = $1 ORDER BY ca.accuracy DESC LIMIT 50`,
    challenge.id
  ) as any[];

  // Get user names
  const userIds = attempts.map((a: any) => a.user_id);
  const users = userIds.length > 0
    ? await db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, firstName: true, lastName: true } })
    : [];
  const userMap = Object.fromEntries(users.map(u => [u.id, `${u.firstName || ""} ${u.lastName || ""}`.trim()]));

  // Get org names
  const orgIds = [...new Set(attempts.map((a: any) => a.org_id).filter(Boolean))];
  const orgs = orgIds.length > 0
    ? await db.organization.findMany({ where: { id: { in: orgIds } }, select: { id: true, name: true } })
    : [];
  const orgMap = Object.fromEntries(orgs.map(o => [o.id, o.name]));

  // Check if current user has attempted
  const myAttempt = attempts.find((a: any) => a.user_id === user.id);

  // Days remaining
  const nextMonday = new Date(monday);
  nextMonday.setDate(nextMonday.getDate() + 7);
  const daysLeft = Math.max(0, Math.ceil((nextMonday.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

  return NextResponse.json({
    challenge: { ...challenge, week_start: weekStr },
    leaderboard: attempts.map((a: any, i: number) => ({
      rank: i + 1,
      name: userMap[a.user_id] || "Unknown",
      org: orgMap[a.org_id] || "",
      accuracy: a.accuracy,
      isYou: a.user_id === user.id,
    })),
    myAttempt: myAttempt ? { accuracy: myAttempt.accuracy } : null,
    daysLeft,
    totalAttempts: attempts.length,
  });
}
