export const dynamic = "force-dynamic";
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
    status TEXT DEFAULT 'PENDING',
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

// GET — list duels for the user
export async function GET() {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureTable();

  const duels = await db.$queryRawUnsafe(
    `SELECT * FROM duels WHERE (challenger_id = $1 OR opponent_id = $1) AND org_id = $2 ORDER BY created_at DESC LIMIT 20`,
    user.id, user.orgId
  ) as any[];

  return NextResponse.json({ duels, userId: user.id });
}

// POST — create or join a duel
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureTable();

  const { action, duelId, opponentId, theme, answers } = await req.json();

  if (action === "create") {
    // Generate 5 quick duel questions
    let questions;
    try {
      const client = new Anthropic();
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514", max_tokens: 2000,
        messages: [{ role: "user", content: `Generate 5 rapid-fire cybersecurity duel questions about "${theme || "ransomware"}". Each should be answerable in 15 seconds. Return ONLY valid JSON:
{"questions": [{"question": "...", "options": [{"text": "...", "isCorrect": true}, {"text": "...", "isCorrect": false}, {"text": "...", "isCorrect": false}], "explanation": "..."}]}` }],
      });
      const text = (response.content[0] as any).text;
      const match = text.match(/\{[\s\S]*\}/);
      questions = match ? JSON.parse(match[0]).questions : null;
    } catch {}

    if (!questions) {
      questions = [
        { question: "What's the first action in a ransomware incident?", options: [{ text: "Isolate affected systems", isCorrect: true }, { text: "Pay the ransom", isCorrect: false }, { text: "Reboot all servers", isCorrect: false }], explanation: "Isolation prevents lateral spread." },
        { question: "MFA bypass via session token theft is called?", options: [{ text: "Pass-the-cookie", isCorrect: true }, { text: "Brute force", isCorrect: false }, { text: "SQL injection", isCorrect: false }], explanation: "Stolen session tokens bypass MFA entirely." },
        { question: "Which framework maps attacker techniques?", options: [{ text: "MITRE ATT&CK", isCorrect: true }, { text: "OWASP Top 10", isCorrect: false }, { text: "ISO 27001", isCorrect: false }], explanation: "MITRE ATT&CK catalogues adversary tactics and techniques." },
        { question: "A supply chain attack targets?", options: [{ text: "Software vendors and their updates", isCorrect: true }, { text: "Physical supply warehouses", isCorrect: false }, { text: "Email attachments only", isCorrect: false }], explanation: "Supply chain attacks compromise trusted software distribution channels." },
        { question: "What does EDR stand for?", options: [{ text: "Endpoint Detection & Response", isCorrect: true }, { text: "Email Data Recovery", isCorrect: false }, { text: "Enterprise Data Routing", isCorrect: false }], explanation: "EDR monitors endpoints for suspicious activity." },
      ];
    }

    const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Challenger";
    await db.$executeRawUnsafe(
      `INSERT INTO duels (challenger_id, challenger_name, org_id, theme, questions, status) VALUES ($1, $2, $3, $4, $5, $6)`,
      user.id, userName, user.orgId, theme || "ransomware", JSON.stringify(questions), opponentId ? "PENDING" : "OPEN"
    );

    const duels = await db.$queryRawUnsafe(`SELECT id FROM duels WHERE challenger_id = $1 ORDER BY created_at DESC LIMIT 1`, user.id) as any[];
    return NextResponse.json({ success: true, duelId: duels[0]?.id });
  }

  if (action === "join" && duelId) {
    const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Opponent";
    await db.$executeRawUnsafe(
      `UPDATE duels SET opponent_id = $1, opponent_name = $2, status = 'ACTIVE' WHERE id = $3 AND org_id = $4 AND status IN ('OPEN', 'PENDING') AND challenger_id != $1`,
      user.id, userName, duelId, user.orgId
    );
    return NextResponse.json({ success: true });
  }

  if (action === "answer" && duelId && answers) {
    const duels = await db.$queryRawUnsafe(`SELECT * FROM duels WHERE id = $1`, duelId) as any[];
    if (duels.length === 0) return NextResponse.json({ error: "Duel not found" }, { status: 404 });
    const duel = duels[0];

    const score = answers.filter((a: any) => a.correct).length;
    const isChallenger = duel.challenger_id === user.id;

    if (isChallenger) {
      await db.$executeRawUnsafe(`UPDATE duels SET challenger_answers = $1, challenger_score = $2 WHERE id = $3`, JSON.stringify(answers), score, duelId);
    } else {
      await db.$executeRawUnsafe(`UPDATE duels SET opponent_answers = $1, opponent_score = $2 WHERE id = $3`, JSON.stringify(answers), score, duelId);
    }

    // Check if both have answered
    const updated = await db.$queryRawUnsafe(`SELECT * FROM duels WHERE id = $1`, duelId) as any[];
    const d = updated[0];
    const cAnswers = typeof d.challenger_answers === "string" ? JSON.parse(d.challenger_answers) : d.challenger_answers;
    const oAnswers = typeof d.opponent_answers === "string" ? JSON.parse(d.opponent_answers) : d.opponent_answers;

    if (cAnswers.length > 0 && oAnswers.length > 0) {
      const winnerId = d.challenger_score > d.opponent_score ? d.challenger_id : d.opponent_score > d.challenger_score ? d.opponent_id : null;
      await db.$executeRawUnsafe(`UPDATE duels SET status = 'COMPLETED', winner_id = $1, completed_at = NOW() WHERE id = $2`, winnerId, duelId);
    }

    return NextResponse.json({ success: true, score });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
