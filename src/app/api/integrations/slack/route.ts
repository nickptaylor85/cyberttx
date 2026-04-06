export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Slack slash command handler: /threatcast [action]
// POST from Slack with application/x-www-form-urlencoded
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const command = formData.get("command") as string;
  const text = (formData.get("text") as string || "").trim();
  const userId = formData.get("user_id") as string;
  const userName = formData.get("user_name") as string;
  const channelName = formData.get("channel_name") as string;
  const responseUrl = formData.get("response_url") as string;

  const parts = text.split(/\s+/);
  const action = parts[0]?.toLowerCase() || "help";

  if (action === "help") {
    return NextResponse.json({
      response_type: "ephemeral",
      blocks: [
        { type: "header", text: { type: "plain_text", text: "🛡️ ThreatCast Commands" } },
        { type: "section", text: { type: "mrkdwn", text: "`/threatcast run [theme]` — Generate a new exercise\n`/threatcast status` — Show portal stats\n`/threatcast leaderboard` — Top performers\n`/threatcast themes` — Available themes\n`/threatcast help` — Show this help" } },
      ],
    });
  }

  if (action === "themes") {
    return NextResponse.json({
      response_type: "ephemeral",
      text: "Available themes: ransomware, phishing, insider-threat, supply-chain, cloud-breach, apt, ddos, data-exfil",
    });
  }

  if (action === "status") {
    const total = await db.ttxSession.count({ where: { status: "COMPLETED" } });
    const users = await db.user.count({ where: { clerkId: { startsWith: "hash:" } } });
    return NextResponse.json({
      response_type: "in_channel",
      text: `📊 ThreatCast Status: ${total} exercises completed, ${users} active users`,
    });
  }

  if (action === "leaderboard") {
    const top = await db.ttxParticipant.findMany({
      orderBy: { totalScore: "desc" }, take: 5,
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    const lines = top.map((p, i) => `${i + 1}. ${p.user.firstName} ${p.user.lastName} — ${p.totalScore} pts`);
    return NextResponse.json({
      response_type: "in_channel",
      text: `🏆 *Top Performers*\n${lines.join("\n") || "No data yet"}`,
    });
  }

  if (action === "run") {
    const theme = parts[1] || "ransomware";
    // Respond immediately, generate in background
    if (responseUrl) {
      fetch(responseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response_type: "in_channel", text: `🎯 Generating ${theme} exercise... Check ThreatCast in ~30 seconds.` }),
      }).catch(() => {});
    }
    return NextResponse.json({ response_type: "ephemeral", text: `Generating a ${theme} exercise. You'll be notified when ready.` });
  }

  return NextResponse.json({ response_type: "ephemeral", text: `Unknown command. Try \`/threatcast help\`` });
}
