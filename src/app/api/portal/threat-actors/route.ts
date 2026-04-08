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
        max_tokens: 1500,
        tools: [{ type: "web_search_20250305" as any, name: "web_search" } as any],
        messages: [{
          role: "user",
          content: `Search the web for the most active cyber threat actors and ransomware groups in the news RIGHT NOW in 2025-2026. Look for recent attacks, new campaigns, and emerging groups. Then return ONLY a JSON array of the top 5 most newsworthy threat actors with: {name: string, description: string (1 sentence about their latest activity), targets: string[], ttps: string[] (MITRE technique descriptions not IDs)}. No markdown, no explanation, ONLY the JSON array.`
        }],
      });

      // Extract text from response (may have multiple content blocks due to tool use)
      const textBlocks = response.content.filter((b: any) => b.type === "text").map((b: any) => b.text);
      const fullText = textBlocks.join("\n");
      const match = fullText.match(/\[[\s\S]*\]/);
      if (match) {
        const trendingData = JSON.parse(match[0]) as any;
        return NextResponse.json({ actors, trending: trendingData });
      }
    } catch (e: any) {
      console.error("[threat-actors] Trending search error:", e?.message);
    }
  }

  return NextResponse.json({ actors });
}
