export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const command = formData.get("command") as string;
  const text = (formData.get("text") as string || "").trim();
  const userName = formData.get("user_name") as string;

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
    return NextResponse.json({ response_type: "ephemeral", text: "Available themes: ransomware, phishing, insider-threat, supply-chain, cloud-breach, apt, ddos, data-exfil" });
  }

  if (action === "status") {
    const total = await db.ttxSession.count({ where: { status: "COMPLETED" } });
    return NextResponse.json({ response_type: "ephemeral", text: `📊 ThreatCast: ${total} exercises completed` });
  }

  if (action === "leaderboard") {
    const top = await db.ttxParticipant.findMany({
      orderBy: { totalScore: "desc" }, take: 5,
      include: { user: { select: { firstName: true } } },
    });
    const lines = top.map((p, i) => `${i + 1}. ${p.user.firstName || "User"} — ${p.totalScore} pts`);
    return NextResponse.json({ response_type: "ephemeral", text: `🏆 *Top Performers*\n${lines.join("\n") || "No data yet"}` });
  }

  if (action === "run") {
    const theme = parts[1] || "ransomware";
    return NextResponse.json({ response_type: "ephemeral", text: `🎯 Generating ${theme} exercise... Check ThreatCast in ~30 seconds.` });
  }

  return NextResponse.json({ response_type: "ephemeral", text: "Unknown command. Try `/threatcast help`" });
}
