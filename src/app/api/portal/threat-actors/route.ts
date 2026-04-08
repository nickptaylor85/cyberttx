export const dynamic = "force-dynamic";
export const maxDuration = 60;
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { THREAT_ACTORS, searchActors } from "@/lib/threat-actors";
import { db } from "@/lib/db";

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
    // Curated list of additional threat actors not in the built-in database
    const DISCOVER_ACTORS = [
      { name: "Storm-0558", aliases: ["Storm-0558"], origin: "China (MSS)", type: "nation-state", motivation: "Espionage", targets: ["Government", "Diplomacy"], activeSince: "2023", description: "Forged Azure AD signing keys to access US government email accounts including State Department and Commerce.", notableAttacks: ["Microsoft cloud email breach (2023)", "US government email access"] },
      { name: "Black Basta", aliases: ["Black Basta"], origin: "Russia", type: "cybercrime", motivation: "RaaS", targets: ["Healthcare", "Manufacturing", "Finance", "Technology"], activeSince: "2022", description: "Prolific ransomware group linked to former Conti operators. Known for double extortion.", notableAttacks: ["Ascension Health (2024)", "ABB Ltd (2023)", "Capita (2023)"] },
      { name: "Akira", aliases: ["Akira"], origin: "Unknown", type: "cybercrime", motivation: "RaaS", targets: ["Education", "Healthcare", "Manufacturing", "Finance"], activeSince: "2023", description: "Fast-growing ransomware group exploiting VPN vulnerabilities, particularly Cisco ASA/FTD.", notableAttacks: ["Stanford University (2023)", "Nissan Oceania (2023)"] },
      { name: "Midnight Blizzard", aliases: ["APT29", "Cozy Bear", "Nobelium"], origin: "Russia (SVR)", type: "nation-state", motivation: "Espionage", targets: ["Technology", "Government", "Defence"], activeSince: "2008", description: "Breached Microsoft corporate email in 2024 via password spray attack on legacy test tenant.", notableAttacks: ["Microsoft corporate breach (2024)", "TeamViewer breach (2024)"] },
      { name: "Medusa", aliases: ["MedusaLocker", "Medusa Team"], origin: "Unknown", type: "cybercrime", motivation: "RaaS", targets: ["Education", "Healthcare", "Government"], activeSince: "2022", description: "Ransomware group that posts victim data on a dedicated leak site and demands multi-million dollar ransoms.", notableAttacks: ["Minneapolis Public Schools (2023)", "Toyota Financial Services (2023)"] },
      { name: "NoName057(16)", aliases: ["NoName"], origin: "Russia", type: "hacktivist", motivation: "Pro-Russia hacktivism", targets: ["Government", "Finance", "Transport", "Media"], activeSince: "2022", description: "Pro-Russian DDoS group targeting NATO countries with Project DDoSia crowdsourced attack tool.", notableAttacks: ["Czech government (2023)", "Swiss government (2024)", "NATO websites"] },
      { name: "Play Ransomware", aliases: ["PlayCrypt", "Play"], origin: "Unknown", type: "cybercrime", motivation: "RaaS", targets: ["Government", "Manufacturing", "Technology", "Telecoms"], activeSince: "2022", description: "Ransomware group known for exploiting FortiOS and Microsoft Exchange vulnerabilities.", notableAttacks: ["City of Oakland (2023)", "Rackspace (2022)", "Arnold Clark (2022)"] },
      { name: "Hunters International", aliases: ["Hunters"], origin: "Unknown", type: "cybercrime", motivation: "RaaS", targets: ["Healthcare", "Manufacturing", "Government"], activeSince: "2023", description: "Successor to Hive ransomware. Focuses on data exfiltration over encryption.", notableAttacks: ["US Navy contractor (2024)", "Fred Hutchinson Cancer Center (2023)"] },
      { name: "CyberAv3ngers", aliases: ["IRGC-CEC"], origin: "Iran (IRGC)", type: "hacktivist", motivation: "Anti-Israel hacktivism", targets: ["Water", "Energy", "Critical Infrastructure"], activeSince: "2023", description: "Iranian group targeting Israeli-made Unitronics PLCs in US and UK water treatment facilities.", notableAttacks: ["Aliquippa PA water (2023)", "UK water facilities (2024)"] },
      { name: "Qilin", aliases: ["Agenda"], origin: "Russia", type: "cybercrime", motivation: "RaaS", targets: ["Healthcare", "Manufacturing", "Technology"], activeSince: "2022", description: "Ransomware group that attacked NHS pathology provider Synnovis, causing major London hospital disruption.", notableAttacks: ["Synnovis/NHS (2024)", "Yanfeng Automotive (2023)"] },
    ];

    // Filter out actors already in the database
    const existingNames = new Set(actors.map(a => a.name.toLowerCase()));
    const newActors = DISCOVER_ACTORS.filter(a => !existingNames.has(a.name.toLowerCase()));

    return NextResponse.json({ actors, trending: newActors });
  }

  return NextResponse.json({ actors });
}

// POST — add a discovered actor to the database
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "CLIENT_ADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
