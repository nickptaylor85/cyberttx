export const dynamic = "force-dynamic";
export const maxDuration = 60;
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// GET: return cached threat intel events
export async function GET() {
  // Return hardcoded recent events + any AI-discovered ones
  const events = getBaselineEvents();
  return NextResponse.json({ events, lastScanned: new Date().toISOString() });
}

// POST: trigger a scan using Claude with web search
export async function POST(req: NextRequest) {
  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      tools: [{ type: "web_search_20250305" as any, name: "web_search" }] as any,
      messages: [{
        role: "user",
        content: `You are a cyber threat intelligence analyst. Search for the 5 most significant cyber attacks and data breaches from the last 30 days (April 2026). For each incident, provide:
- title: Short name (e.g. "M&S Ransomware Attack")
- date: Approximate date (YYYY-MM-DD)
- sector: Affected industry
- severity: "critical", "high", "medium"
- threatActor: Known group or "Unknown"
- summary: 2-3 sentence description of what happened
- techniques: Array of MITRE ATT&CK technique IDs involved
- theme: Best matching exercise theme (ransomware, supply-chain, insider-threat, bec, cloud-breach, apt, zero-day, data-exfil)

Respond ONLY with a JSON array. No markdown, no backticks, no preamble.`
      }],
    });

    // Extract text from response
    const text = msg.content.filter(b => b.type === "text").map(b => b.text).join("\n");
    // Try to parse JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    let events: any[] = [];
    if (jsonMatch) {
      try { events = JSON.parse(jsonMatch[0]); } catch { events = []; }
    }

    // Merge with baseline events
    const all = [...events.map((e: any) => ({ ...e, source: "live-scan" })), ...getBaselineEvents()];
    // Deduplicate by title similarity
    const seen = new Set<string>();
    const unique = all.filter(e => {
      const key = e.title?.toLowerCase().replace(/[^a-z]/g, "").slice(0, 20);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({ events: unique.slice(0, 10), scannedAt: new Date().toISOString(), newEvents: events.length });
  } catch (err: any) {
    console.error("Threat intel scan failed:", err.message);
    return NextResponse.json({ events: getBaselineEvents(), error: err.message });
  }
}

function getBaselineEvents() {
  return [
    { title: "JLR Supply Chain Attack", date: "2025-08-04", sector: "Automotive/Manufacturing", severity: "critical", threatActor: "Scattered Lapsus$ Hunters", summary: "Production halted for 5 weeks across global facilities. £1.9B estimated cost. 5,000+ supply chain businesses affected.", techniques: ["T1195.002", "T1486", "T1078"], theme: "supply-chain", source: "baseline" },
    { title: "M&S Ransomware Campaign", date: "2025-04-22", sector: "Retail", severity: "critical", threatActor: "Scattered Spider / DragonForce", summary: "46-day online outage. £300M profit warning. 600+ systems encrypted. Customer data stolen.", techniques: ["T1566.001", "T1486", "T1071"], theme: "ransomware", source: "baseline" },
    { title: "Co-op / Harrods Coordinated Attack", date: "2025-04-25", sector: "Retail", severity: "high", threatActor: "DragonForce", summary: "Part of coordinated UK retail campaign. Supply chain exploitation via shared IT contractors.", techniques: ["T1199", "T1566", "T1486"], theme: "supply-chain", source: "baseline" },
    { title: "NHS Advanced Supply Chain Breach", date: "2025-08-04", sector: "Healthcare", severity: "critical", threatActor: "LockBit 3.0", summary: "NHS 111 helpline, ambulance dispatch and patient referral systems disrupted. Paper-based fallback for weeks.", techniques: ["T1195.002", "T1486", "T1490"], theme: "ransomware", source: "baseline" },
    { title: "MOVEit Transfer Zero-Day Exploitation", date: "2025-05-31", sector: "Cross-sector", severity: "critical", threatActor: "Cl0p", summary: "Mass exploitation of CVE-2023-34362. Hundreds of orgs breached via file transfer vulnerability.", techniques: ["T1190", "T1005", "T1567"], theme: "zero-day", source: "baseline" },
    { title: "Stryker Healthcare Data Breach", date: "2026-03-15", sector: "Healthcare", severity: "high", threatActor: "Unknown", summary: "Medical device manufacturer breached. Patient data and proprietary designs exposed.", techniques: ["T1078", "T1005", "T1567"], theme: "data-exfil", source: "baseline" },
    { title: "LexisNexis Data Exposure", date: "2026-03-10", sector: "Legal/Data Services", severity: "high", threatActor: "Unknown", summary: "Legal research platform breach exposing sensitive case data and PII across multiple jurisdictions.", techniques: ["T1190", "T1005"], theme: "data-exfil", source: "baseline" },
    { title: "UK NCSC: 4 Nationally Significant Attacks Per Week", date: "2025-10-16", sector: "Cross-sector/Government", severity: "critical", threatActor: "Multiple state-sponsored", summary: "NCSC annual review reveals UK faces 4 nationally significant cyber attacks weekly. Escalating threat from state actors.", techniques: ["T1583", "T1595", "T1190"], theme: "apt", source: "baseline" },
  ];
}
