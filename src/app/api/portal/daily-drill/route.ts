export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import Anthropic from "@anthropic-ai/sdk";

const DAILY_TOPICS = [
  "phishing email identification", "ransomware initial response", "suspicious login detection",
  "data exfiltration indicators", "insider threat warning signs", "cloud misconfiguration triage",
  "malware containment steps", "incident escalation decisions", "network segmentation under attack",
  "credential compromise response", "supply chain risk assessment", "DDoS mitigation priority",
  "social engineering recognition", "privilege escalation detection", "lateral movement indicators",
];

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const topic = DAILY_TOPICS[dayOfYear % DAILY_TOPICS.length];

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514", max_tokens: 1500,
      messages: [{ role: "user", content: `Generate exactly 3 rapid-fire cybersecurity quiz questions about "${topic}". Each question should be answerable in under 20 seconds. Return ONLY valid JSON, no other text:
{
  "topic": "${topic}",
  "questions": [
    { "question": "...", "options": [{"text": "...", "isCorrect": true}, {"text": "...", "isCorrect": false}, {"text": "...", "isCorrect": false}], "explanation": "..." }
  ]
}` }],
    });
    const text = (response.content[0] as any).text;
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return NextResponse.json(JSON.parse(match[0]));
  } catch {}

  return NextResponse.json({
    topic, questions: [
      { question: `What is the first step when you detect ${topic}?`, options: [{ text: "Isolate and assess", isCorrect: true }, { text: "Ignore it", isCorrect: false }, { text: "Delete all logs", isCorrect: false }], explanation: "Always isolate and assess before taking further action." },
      { question: "Who should be notified first?", options: [{ text: "SOC team lead", isCorrect: true }, { text: "The media", isCorrect: false }, { text: "No one", isCorrect: false }], explanation: "Your SOC team lead coordinates the response." },
      { question: "What should be preserved?", options: [{ text: "Evidence and logs", isCorrect: true }, { text: "Nothing", isCorrect: false }, { text: "Only emails", isCorrect: false }], explanation: "Preserving evidence is critical for investigation." },
    ]
  });
}
