export const dynamic = "force-dynamic";
export const maxDuration = 30;
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { THREAT_ACTORS, searchActors } from "@/lib/threat-actors";
import Anthropic from "@anthropic-ai/sdk";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const search = req.nextUrl.searchParams.get("search");
  const type = req.nextUrl.searchParams.get("type");
  const trending = req.nextUrl.searchParams.get("trending");

  let actors = THREAT_ACTORS;
  if (search) actors = searchActors(search);
  if (type) actors = actors.filter(a => a.type === type);

  if (trending === "true") {
    try {
      const client = new Anthropic();
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: "What are the 5 most active cyber threat actors or ransomware groups in the news right now (2025-2026)? Return ONLY a JSON array with objects: {name, description, targets: [], ttps: []}. No markdown, just JSON."
        }],
      });
      const text = (response.content[0] as any).text || "";
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const trendingData = JSON.parse(match[0]) as any;
        return NextResponse.json({ actors, trending: trendingData });
      }
    } catch {}
  }

  return NextResponse.json({ actors });
}
