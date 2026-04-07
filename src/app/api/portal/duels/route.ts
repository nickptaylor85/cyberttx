export const dynamic = "force-dynamic";
export const maxDuration = 30;
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

async function ensureTable() {
  await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS duels (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    challenger_id TEXT NOT NULL,
    opponent_id TEXT,
    challenger_name TEXT,
    opponent_name TEXT,
    org_id TEXT NOT NULL,
    theme TEXT DEFAULT 'ransomware',
    status TEXT DEFAULT 'OPEN',
    questions JSONB,
    challenger_answers JSONB DEFAULT '[]'::jsonb,
    opponent_answers JSONB DEFAULT '[]'::jsonb,
    challenger_score INT DEFAULT 0,
    opponent_score INT DEFAULT 0,
    winner_id TEXT,
    xp_reward INT DEFAULT 50,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
  )`);
}

async function sendDuelEmails(challengerName: string, theme: string, duelId: string, orgId: string, challengerId: string) {
  if (!process.env.RESEND_API_KEY) return;
  
  // Get all active users in the same org EXCEPT the challenger
  const teammates = await db.user.findMany({
    where: { orgId, clerkId: { startsWith: "hash:" }, isActive: true, id: { not: challengerId } },
    select: { email: true, firstName: true },
  });

  for (const teammate of teammates) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "ThreatCast <onboarding@resend.dev>",
          to: [teammate.email],
          subject: `⚔️ ${challengerName} challenged your team to a duel!`,
          html: `<div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto;padding:40px 20px;">
            <div style="font-size:20px;font-weight:700;margin-bottom:16px;">Threat<span style="color:#14b89a;">Cast</span></div>
            <h2 style="color:#a855f7;">⚔️ Duel Challenge!</h2>
            <p>Hey ${teammate.firstName || "there"}, <strong>${challengerName}</strong> has thrown down the gauntlet!</p>
            <div style="background:#1a1a2e;padding:16px;border-radius:8px;border-left:3px solid #a855f7;margin:16px 0;">
              <p style="color:#fff;font-size:14px;margin:0;"><strong>Theme:</strong> ${theme.replace(/-/g, " ")}</p>
              <p style="color:#888;font-size:13px;margin:4px 0 0;">5 questions · First to join duels · 75-second timer</p>
            </div>
            <p style="color:#888;font-size:13px;">Be the first to accept and prove you're the better defender.</p>
            <a href="https://threatcast.io/portal/duels" style="display:inline-block;background:#a855f7;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Accept the Duel →</a>
            <p style="color:#555;font-size:11px;margin-top:24px;">First teammate to join gets the match. Don't wait!</p>
          </div>`,
        }),
      });
    } catch {}
  }
}

async function generateDuelQuestions(theme: string): Promise<any[]> {
  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514", max_tokens: 2000,
      messages: [{ role: "user", content: `Generate 5 rapid-fire cybersecurity duel questions about "${theme}". Each should be answerable in 15 seconds. Make them punchy and competitive — these are for a head-to-head battle. Include a "📰 This Really Happened" reference in each explanation. Return ONLY valid JSON:
{"questions": [{"question": "...", "options": [{"text": "...", "isCorrect": true}, {"text": "...", "isCorrect": false}, {"text": "...", "isCorrect": false}], "explanation": "..."}]}` }],
    });
    const text = (response.content[0] as any).text;
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]).questions;
  } catch {}

  return [
    { question: "What's the first action in a ransomware incident?", options: [{ text: "Isolate affected systems", isCorrect: true }, { text: "Pay the ransom", isCorrect: false }, { text: "Reboot all servers", isCorrect: false }], explanation: "Isolation prevents lateral spread. 📰 This Really Happened: Colonial Pipeline (2021) — a single VPN password led to a $4.4M ransom payment." },
    { question: "MFA bypass via session token theft is called?", options: [{ text: "Pass-the-cookie", isCorrect: true }, { text: "Brute force", isCorrect: false }, { text: "SQL injection", isCorrect: false }], explanation: "Stolen session tokens bypass MFA entirely. 📰 This Really Happened: Okta (2023) — attackers stole session tokens from support case HAR files." },
    { question: "Which framework maps attacker techniques?", options: [{ text: "MITRE ATT&CK", isCorrect: true }, { text: "OWASP Top 10", isCorrect: false }, { text: "ISO 27001", isCorrect: false }], explanation: "MITRE ATT&CK catalogues adversary tactics and techniques across the kill chain." },
    { question: "A supply chain attack targets?", options: [{ text: "Software vendors and their updates", isCorrect: true }, { text: "Physical supply warehouses", isCorrect: false }, { text: "Email attachments only", isCorrect: false }], explanation: "Supply chain attacks compromise trusted software distribution. 📰 This Really Happened: SolarWinds (2020) — 18,000 orgs installed a trojanised update." },
    { question: "What does EDR stand for?", options: [{ text: "Endpoint Detection & Response", isCorrect: true }, { text: "Email Data Recovery", isCorrect: false }, { text: "Enterprise Data Routing", isCorrect: false }], explanation: "EDR monitors endpoints for suspicious activity and enables rapid response." },
  ];
}

// GET — list duels for the user
export async function GET() {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureTable();

  const duels = await db.$queryRawUnsafe(
    `SELECT * FROM duels WHERE org_id = $1 ORDER BY created_at DESC LIMIT 20`,
    user.orgId
  ) as any[];

  return NextResponse.json({ duels, userId: user.id });
}

// POST — create, join, or answer a duel
export async function POST(req: NextRequest) {
  try {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureTable();

  const { action, duelId, theme, answers } = await req.json();

  if (action === "create") {
    const questions = await generateDuelQuestions(theme || "ransomware");
    const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Challenger";
    
    await db.$executeRawUnsafe(
      `INSERT INTO duels (challenger_id, challenger_name, org_id, theme, questions, status) VALUES ($1, $2, $3, $4, $5::jsonb, 'OPEN')`,
      user.id, userName, user.orgId, theme || "ransomware", JSON.stringify(questions)
    );

    const duels = await db.$queryRawUnsafe(`SELECT id FROM duels WHERE challenger_id = $1 AND org_id = $2 ORDER BY created_at DESC LIMIT 1`, user.id, user.orgId) as any[];
    const newDuelId = duels[0]?.id;

    // Send email to all teammates
    sendDuelEmails(userName, theme || "ransomware", newDuelId, user.orgId, user.id).catch(() => {});

    return NextResponse.json({ success: true, duelId: newDuelId });
  }

  if (action === "join" && duelId) {
    // Check the duel is still open and user isn't the challenger
    const existing = await db.$queryRawUnsafe(
      `SELECT * FROM duels WHERE id = $1 AND org_id = $2 AND status = 'OPEN' AND challenger_id != $3`,
      duelId, user.orgId, user.id
    ) as any[];

    if (existing.length === 0) return NextResponse.json({ error: "Duel not available — already taken or you created it" }, { status: 409 });

    const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Opponent";
    await db.$executeRawUnsafe(
      `UPDATE duels SET opponent_id = $1, opponent_name = $2, status = 'ACTIVE' WHERE id = $3 AND status = 'OPEN'`,
      user.id, userName, duelId
    );

    return NextResponse.json({ success: true });
  }

  if (action === "answer" && duelId && answers) {
    const duels = await db.$queryRawUnsafe(`SELECT * FROM duels WHERE id = $1 AND org_id = $2`, duelId, user.orgId) as any[];
    if (duels.length === 0) return NextResponse.json({ error: "Duel not found" }, { status: 404 });
    const duel = duels[0];

    if (duel.status !== "ACTIVE") return NextResponse.json({ error: "Duel is not active" }, { status: 400 });

    const score = answers.filter((a: any) => a.correct).length;
    const isChallenger = duel.challenger_id === user.id;

    if (isChallenger) {
      await db.$executeRawUnsafe(`UPDATE duels SET challenger_answers = $1::jsonb, challenger_score = $2 WHERE id = $3`, JSON.stringify(answers), score, duelId);
    } else if (duel.opponent_id === user.id) {
      await db.$executeRawUnsafe(`UPDATE duels SET opponent_answers = $1::jsonb, opponent_score = $2 WHERE id = $3`, JSON.stringify(answers), score, duelId);
    } else {
      return NextResponse.json({ error: "You're not in this duel" }, { status: 403 });
    }

    // Check if both have answered
    const updated = await db.$queryRawUnsafe(`SELECT * FROM duels WHERE id = $1`, duelId) as any[];
    const d = updated[0];
    const cAnswers = typeof d.challenger_answers === "string" ? JSON.parse(d.challenger_answers) : d.challenger_answers || [];
    const oAnswers = typeof d.opponent_answers === "string" ? JSON.parse(d.opponent_answers) : d.opponent_answers || [];

    if (cAnswers.length > 0 && oAnswers.length > 0) {
      const winnerId = d.challenger_score > d.opponent_score ? d.challenger_id : d.opponent_score > d.challenger_score ? d.opponent_id : null;
      await db.$executeRawUnsafe(`UPDATE duels SET status = 'COMPLETED', winner_id = $1, completed_at = NOW() WHERE id = $2`, winnerId, duelId);
    }

    return NextResponse.json({ success: true, score });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
} catch (e: any) {
  console.error("[duels] Error:", e?.message || e);
  return NextResponse.json({ error: "Failed to process duel: " + (e?.message || "unknown error") }, { status: 500 });
}
}
