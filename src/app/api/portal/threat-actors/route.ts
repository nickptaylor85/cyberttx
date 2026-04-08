export const dynamic = "force-dynamic";
export const maxDuration = 30;
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { THREAT_ACTORS, searchActors } from "@/lib/threat-actors";
import { db } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

async function ensureTable() {
  await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS custom_threat_actors (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    aliases TEXT[] DEFAULT '{}',
    origin TEXT DEFAULT 'Unknown',
    type TEXT DEFAULT 'cybercrime',
    motivation TEXT DEFAULT '',
    targets TEXT[] DEFAULT '{}',
    active_since TEXT DEFAULT '',
    ttps TEXT[] DEFAULT '{}',
    ttp_descriptions TEXT[] DEFAULT '{}',
    notable_attacks TEXT[] DEFAULT '{}',
    description TEXT DEFAULT '',
    added_by TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )`);
}

async function getDbActors() {
  try {
    await ensureTable();
    const rows = await db.$queryRawUnsafe(`SELECT * FROM custom_threat_actors ORDER BY created_at DESC`) as any[];
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      aliases: r.aliases || [],
      origin: r.origin || "Unknown",
      type: r.type || "cybercrime",
      motivation: r.motivation || "",
      targets: r.targets || [],
      activeSince: r.active_since || "",
      ttps: r.ttps || [],
      ttpDescriptions: r.ttp_descriptions || [],
      notableAttacks: r.notable_attacks || [],
      description: r.description || "",
      isCustom: true,
    }));
  } catch { return []; }
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const search = req.nextUrl.searchParams.get("search");
  const type = req.nextUrl.searchParams.get("type");
  const trending = req.nextUrl.searchParams.get("trending");

  // Combine hardcoded + DB actors
  const dbActors = await getDbActors();
  let actors = [...THREAT_ACTORS, ...dbActors];

  if (search) {
    const s = search.toLowerCase();
    actors = actors.filter(a =>
      a.name.toLowerCase().includes(s) ||
      a.aliases.some((al: string) => al.toLowerCase().includes(s)) ||
      a.origin.toLowerCase().includes(s) ||
      a.targets.some((t: string) => t.toLowerCase().includes(s))
    );
  }
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
          content: `Search the web for the most active cyber threat actors and ransomware groups in the news RIGHT NOW in 2025-2026. Return ONLY a JSON array of 5 actors: [{name, aliases: [], origin, type: "nation-state"|"cybercrime"|"hacktivist", motivation, targets: [], activeSince, description (1 sentence), notableAttacks: []}]. No markdown, ONLY JSON array.`
        }],
      });

      const textBlocks = response.content.filter((b: any) => b.type === "text").map((b: any) => b.text);
      const fullText = textBlocks.join("\n");
      const match = fullText.match(/\[[\s\S]*\]/);
      if (match) {
        const trendingData = JSON.parse(match[0]) as any[];
        return NextResponse.json({ actors, trending: trendingData });
      }
    } catch (e: any) {
      console.error("[threat-actors] Trending search error:", e?.message);
    }
  }

  return NextResponse.json({ actors });
}

// POST — add a discovered actor to the database
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await ensureTable();
  const actor = await req.json();

  if (!actor.name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  // Check if already exists (by name)
  const existing = await db.$queryRawUnsafe(
    `SELECT id FROM custom_threat_actors WHERE LOWER(name) = LOWER($1)`, actor.name
  ) as any[];

  if (existing.length > 0) {
    return NextResponse.json({ error: "Actor already exists", id: existing[0].id }, { status: 409 });
  }

  await db.$executeRawUnsafe(
    `INSERT INTO custom_threat_actors (name, aliases, origin, type, motivation, targets, active_since, ttps, ttp_descriptions, notable_attacks, description, added_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    actor.name,
    actor.aliases || [],
    actor.origin || "Unknown",
    actor.type || "cybercrime",
    actor.motivation || "",
    actor.targets || [],
    actor.activeSince || "",
    actor.ttps || [],
    actor.ttpDescriptions || [],
    actor.notableAttacks || [],
    actor.description || "",
    user.id
  );

  return NextResponse.json({ success: true });
}
