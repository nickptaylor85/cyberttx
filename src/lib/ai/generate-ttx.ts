import Anthropic from "@anthropic-ai/sdk";
import type { TtxScenario, TtxStage } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface OrgProfile {
  industry?: string;
  companySize?: string;
  headquarters?: string;
  operatingRegions?: string[];
  primaryCloudProvider?: string;
  hasOnPremInfra?: boolean;
  endpointCount?: string;
  serverCount?: string;
  hasOtEnvironment?: boolean;
  otDescription?: string;
  securityTeamSize?: string;
  socModel?: string;
  complianceFrameworks?: string[];
  incidentFrequency?: string;
  networkDescription?: string;
  remoteWorkPercentage?: string;
  branchOffices?: string;
  criticalAssets?: string;
  regulatoryBodies?: string[];
  recentIncidents?: string;
  biggestConcerns?: string;
  additionalContext?: string;
}

interface Character {
  name: string;
  role: string;
  department?: string;
  description?: string;
  expertise?: string[];
}

interface PastPerformance {
  theme: string;
  difficulty: string;
  avgScorePercent: number;
  hardestTopics: string[];
  easiestTopics: string[];
  sessionsCompleted: number;
}

interface GenerateTtxParams {
  theme: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  mitreAttackIds: string[];
  securityTools: { name: string; vendor: string; category: string }[];
  questionCount: number;
  orgProfile?: OrgProfile | null;
  characters?: Character[];
  pastPerformance?: PastPerformance | null;
  customIncident?: string;
  language?: string;
}

const DIFFICULTY_CONFIG = {
  BEGINNER: {
    pointsEasy: 100, pointsMedium: 150, pointsHard: 200,
    questionMix: { easy: 0.5, medium: 0.35, hard: 0.15 },
    description: "Entry-level security analyst with 0-2 years experience",
  },
  INTERMEDIATE: {
    pointsEasy: 100, pointsMedium: 200, pointsHard: 300,
    questionMix: { easy: 0.2, medium: 0.5, hard: 0.3 },
    description: "Mid-level analyst with 2-5 years experience",
  },
  ADVANCED: {
    pointsEasy: 100, pointsMedium: 200, pointsHard: 400,
    questionMix: { easy: 0.1, medium: 0.3, hard: 0.6 },
    description: "Senior analyst or team lead with 5-10 years experience",
  },
  EXPERT: {
    pointsEasy: 100, pointsMedium: 300, pointsHard: 500,
    questionMix: { easy: 0.05, medium: 0.25, hard: 0.7 },
    description: "CISO/Director level or specialist with 10+ years experience",
  },
};

function buildCompanyContext(profile?: OrgProfile | null): string {
  if (!profile || !profile.industry) return "No company profile provided — use a generic mid-sized enterprise.";

  const parts: string[] = [];
  if (profile.industry) parts.push(`Industry: ${profile.industry}`);
  if (profile.companySize) parts.push(`Size: ${profile.companySize} employees`);
  if (profile.headquarters) parts.push(`HQ: ${profile.headquarters}`);
  if (profile.operatingRegions?.length) parts.push(`Operating in: ${profile.operatingRegions.join(", ")}`);
  if (profile.primaryCloudProvider) parts.push(`Cloud: ${profile.primaryCloudProvider}`);
  if (profile.hasOnPremInfra) parts.push(`On-premises infrastructure: Yes`);
  if (profile.endpointCount) parts.push(`Endpoints: ${profile.endpointCount}`);
  if (profile.serverCount) parts.push(`Servers: ${profile.serverCount}`);
  if (profile.hasOtEnvironment) parts.push(`OT/ICS: ${profile.otDescription || "Yes"}`);
  if (profile.securityTeamSize) parts.push(`Security team: ${profile.securityTeamSize}`);
  if (profile.socModel) parts.push(`SOC model: ${profile.socModel}`);
  if (profile.complianceFrameworks?.length) parts.push(`Compliance: ${profile.complianceFrameworks.join(", ")}`);
  if (profile.incidentFrequency) parts.push(`Incident frequency: ${profile.incidentFrequency}`);
  if (profile.networkDescription) parts.push(`Network: ${profile.networkDescription}`);
  if (profile.remoteWorkPercentage) parts.push(`Remote work: ${profile.remoteWorkPercentage}`);
  if (profile.branchOffices) parts.push(`Branch offices: ${profile.branchOffices}`);
  if (profile.criticalAssets) parts.push(`Critical assets: ${profile.criticalAssets}`);
  if (profile.regulatoryBodies?.length) parts.push(`Regulators: ${profile.regulatoryBodies.join(", ")}`);
  if (profile.recentIncidents) parts.push(`Recent incidents: ${profile.recentIncidents}`);
  if (profile.biggestConcerns) parts.push(`Biggest concerns: ${profile.biggestConcerns}`);
  if (profile.additionalContext) parts.push(`Additional context: ${profile.additionalContext}`);
  return parts.join("\n  ");
}

function buildCharacterContext(characters?: Character[]): string {
  if (!characters?.length) return "";

  return `

CAST OF CHARACTERS — You MUST weave these named individuals into the narrative as active participants. They should send messages, raise alerts, make decisions, argue, escalate, and be referenced in questions BY NAME:

${characters.map((c, i) => {
  let desc = `  ${i + 1}. ${c.name} — ${c.role}`;
  if (c.department) desc += ` (${c.department})`;
  if (c.description) desc += `\n     Personality & Background: ${c.description}`;
  if (c.expertise?.length) desc += `\n     Expertise: ${c.expertise.join(", ")}`;
  return desc;
}).join("\n\n")}

CHARACTER RULES:
- Characters act consistently with their role, expertise level, AND personality description
- If a character has a description/background, USE IT to shape how they respond (e.g., if described as "cautious and methodical", they should advocate for careful analysis; if "aggressive and decisive", they should push for immediate action)
- Characters with specific expertise should demonstrate that expertise in their dialogue and decisions
- Reference characters BY NAME in narratives (e.g., "At 02:47 GMT, ${characters[0]?.name || 'the analyst'} receives a Slack message from...")
- Show realistic team dynamics — escalation chains, disagreements, pressure from leadership
- Include direct quotes from characters in the narrative (simulated Slack/email/call)
- Questions should ask "What should ${characters.find(c => c.role.includes('Analyst') || c.role.includes('SOC'))?.name || 'the analyst'} do next?" style framing
- The reader should feel like they ARE one of these characters`;
}

function buildLearningContext(perf?: PastPerformance | null): string {
  if (!perf || perf.sessionsCompleted < 2) return "";

  const parts: string[] = ["\nADAPTIVE DIFFICULTY — Based on this team's past performance across " + perf.sessionsCompleted + " sessions:"];
  parts.push(`  Average score: ${Math.round(perf.avgScorePercent)}%`);

  if (perf.avgScorePercent > 85) {
    parts.push(`  INSTRUCTION: Team is excelling. INCREASE complexity significantly:`);
    parts.push(`  - Use subtle distractors where 2-3 options seem valid`);
    parts.push(`  - Include questions about edge cases and exception handling`);
    parts.push(`  - Add time-pressure context ("you have 15 minutes before the board call")`);
    parts.push(`  - Include questions about post-incident activities and governance`);
  } else if (perf.avgScorePercent > 70) {
    parts.push(`  INSTRUCTION: Team is performing well. Maintain difficulty with targeted challenges:`);
    parts.push(`  - Mix in scenario-specific gotchas and red herrings`);
    parts.push(`  - Test cross-tool correlation and multi-step response sequences`);
  } else if (perf.avgScorePercent > 50) {
    parts.push(`  INSTRUCTION: Team at average level. Balance education with challenge:`);
    parts.push(`  - Ensure questions test practical knowledge, not just theory`);
    parts.push(`  - Provide richer context in question stems`);
  } else {
    parts.push(`  INSTRUCTION: Team is struggling. Adjust approach:`);
    parts.push(`  - Make correct answers more distinguishable`);
    parts.push(`  - Include more foundational IR questions`);
    parts.push(`  - Provide detailed educational explanations`);
  }

  if (perf.hardestTopics.length > 0) {
    parts.push(`  WEAK AREAS — include MORE questions targeting: ${perf.hardestTopics.join(", ")}`);
  }
  if (perf.easiestTopics.length > 0) {
    parts.push(`  STRONG AREAS — reduce easy questions about: ${perf.easiestTopics.join(", ")}`);
  }

  if (perf.theme) {
    parts.push(`  Last theme: "${perf.theme}" — if same theme, use significantly different attack vectors and narrative structure.`);
  }

  return parts.join("\n");
}

export async function generateTtxScenario(params: GenerateTtxParams): Promise<TtxScenario> {
  const {
    theme, difficulty, mitreAttackIds, securityTools, questionCount,
    orgProfile, characters, pastPerformance, customIncident, language,
  } = params;

  const diffConfig = DIFFICULTY_CONFIG[difficulty];
  const toolsList = securityTools.length > 0
    ? securityTools.map((t) => `${t.name} (${t.vendor} - ${t.category})`).join("\n  - ")
    : "No specific tools configured — use generic security tooling";
  const mitreList = mitreAttackIds.length > 0 ? mitreAttackIds.join(", ") : "Choose appropriate techniques for the theme";
  const stageCount = Math.min(5, Math.max(3, Math.ceil(questionCount / 3)));
  const questionsPerStage = Math.ceil(questionCount / stageCount);

  const companyContext = buildCompanyContext(orgProfile);
  const characterContext = buildCharacterContext(characters);
  const learningContext = buildLearningContext(pastPerformance);

  const systemPrompt = `You are an elite cybersecurity tabletop exercise designer with 20+ years of experience. You create immersive, realistic TTX scenarios that feel like ACTUAL incidents happening to a SPECIFIC organization — never generic textbook exercises.

CRITICAL REALISM RULES:
Your scenarios MUST be grounded in real-world events and threat intelligence. Base scenarios on actual attack patterns from recent years:
- Ransomware: Model after real campaigns like LockBit, BlackCat/ALPHV, Cl0p, Royal, Play — use their actual TTPs
- APT: Model after real threat groups — APT29 (Cozy Bear), APT28, Lazarus Group, Volt Typhoon, Scattered Spider
- Supply Chain: Reference real patterns like SolarWinds, MOVEit, 3CX, Codecov, Kaseya
- BEC: Use realistic social engineering tactics seen in actual FBI IC3 reports
- Cloud: Base on real misconfiguration patterns from actual cloud breaches
- Zero-Day: Reference real vulnerability patterns (Log4Shell, ProxyShell, Citrix Bleed style)

RELATABILITY:
- Use realistic company names, employee names, department structures
- Include realistic timestamps (e.g., "Friday 17:42 GMT" — attacks often start before weekends)
- Show realistic human reactions — panic, miscommunication, finger-pointing, key people being unavailable
- Include business pressure — CEO asking for updates, regulators calling, media interest, customer complaints
- Show the fog of war — incomplete information, false leads, conflicting alerts
- Reference realistic third parties — managed service providers, IR firms, law enforcement, insurance carriers
- Include realistic bureaucratic obstacles — change management processes, approval chains, vendor SLAs

TARGET ORGANIZATION:
  ${companyContext}
${characterContext}
${learningContext}

${customIncident ? `\nCUSTOM INCIDENT TO BASE SCENARIO ON:\n${customIncident}\n\nUse this real incident as the foundation. Adapt it to the target organization, add realistic details, and create decision-point questions based on the actual events described.` : ""}

${language && language !== "en" ? `
LANGUAGE REQUIREMENT:
Generate ALL content in the following language: ${language}.
This includes: scenario title, narrative text, stage descriptions, question text, answer options, explanations, and all other written content.
Technical terms (MITRE ATT&CK, CVE numbers, tool names) should remain in English.
` : ""}
CRITICAL RULES:
1. Exactly 4 options per question (A-D), exactly ONE correct
2. Wrong options must be plausible — never obviously absurd
3. Reference the organization's SPECIFIC security tools by name
4. Include realistic timestamps, IPs, hashes, log excerpts
5. Narrative must unfold progressively with escalating severity
6. Reference the org's infrastructure, industry, and regulatory context
7. Characters (if defined) MUST appear by name — this is non-negotiable
8. Show tool alerts formatted as they'd actually appear in the real product
9. Include inter-team communications (Slack, email, phone) with named characters
10. Show business impact through the lens of their specific critical assets

SCORING: Easy=${diffConfig.pointsEasy}, Medium=${diffConfig.pointsMedium}, Hard=${diffConfig.pointsHard} pts. Wrong=0.
AUDIENCE: ${diffConfig.description}

RESPONSE FORMAT: Return ONLY valid JSON. No markdown fences, no explanation.`;

  const userPrompt = `Create a cybersecurity TTX:

THEME: ${theme}
DIFFICULTY: ${difficulty}  
MITRE ATT&CK: ${mitreList}
QUESTIONS: ${questionCount} across ${stageCount} stages (~${questionsPerStage}/stage)

SECURITY TOOLS:
  - ${toolsList}

Stage progression:
1. Initial Detection / Early Warning
2. Confirmed Breach / Execution  
3. Escalation / Lateral Movement
4. Impact / Business Disruption
5. Containment & Recovery (if 5 stages)

Question mix: ~${Math.round(diffConfig.questionMix.easy * 100)}% easy, ~${Math.round(diffConfig.questionMix.medium * 100)}% medium, ~${Math.round(diffConfig.questionMix.hard * 100)}% hard

JSON structure:
{
  "title": "string",
  "overview": "string - 2-3 sentence summary",
  "attackerProfile": { "name": "string", "type": "APT|Criminal|Hacktivist|Insider|Unknown", "motivation": "string", "sophistication": "Low|Medium|High|Nation-State" },
  "targetOrganization": { "industry": "string", "size": "string", "description": "string - use org profile" },
  "stages": [{
    "stageNumber": 1,
    "title": "string",
    "mitrePhase": "string",
    "mitreTechniques": ["T-codes"],
    "narrative": "string - rich multi-paragraph narrative with named characters, timestamps, comms",
    "iocIndicators": ["string"],
    "alertsTriggered": [{ "tool": "string - their actual tool", "severity": "critical|high|medium|low", "title": "string - realistic alert title", "description": "string" }],
    "questions": [{
      "questionIndex": 0,
      "question": "string - reference alerts, characters, tools",
      "context": "string|null - log/Slack/email/tool output",
      "options": [
        { "index": 0, "text": "string", "isCorrect": false, "points": 0 },
        { "index": 1, "text": "string", "isCorrect": true, "points": ${diffConfig.pointsMedium} },
        { "index": 2, "text": "string", "isCorrect": false, "points": 0 },
        { "index": 3, "text": "string", "isCorrect": false, "points": 0 }
      ],
      "explanation": "string - why correct answer is right AND why others are wrong",
      "difficulty": "easy|medium|hard"
    }]
  }],
  "totalPoints": 0
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from AI");
  }

  let jsonText = textContent.text.trim();
  jsonText = jsonText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  try {
    const scenario: TtxScenario = JSON.parse(jsonText);
    let calculatedTotal = 0;
    scenario.stages.forEach((stage: TtxStage) => {
      stage.questions.forEach((q) => {
        const correctOption = q.options.find((o) => o.isCorrect);
        if (correctOption) calculatedTotal += correctOption.points;
      });
    });
    scenario.totalPoints = calculatedTotal;

    // Shuffle answer options so correct answer isn't always A or B
    scenario.stages.forEach((stage: TtxStage) => {
      stage.questions.forEach((q) => {
        // Fisher-Yates shuffle
        const opts = [...q.options];
        for (let i = opts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [opts[i], opts[j]] = [opts[j], opts[i]];
        }
        // Re-index after shuffle
        opts.forEach((o, idx) => { o.index = idx; });
        q.options = opts;
      });
    });

    return scenario;
  } catch (e) {
    console.error("Failed to parse AI response:", jsonText.substring(0, 500));
    throw new Error(`Failed to parse TTX scenario: ${e}`);
  }
}

/**
 * Analyze past performance for adaptive difficulty
 */
export async function analyzePastPerformance(
  orgId: string,
  prisma: any
): Promise<PastPerformance | null> {
  const feedback = await prisma.scenarioFeedback.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (feedback.length < 2) return null;

  const avgScore = feedback.reduce((sum: number, f: any) => sum + (f.avgScorePercent || 0), 0) / feedback.length;

  const hardTopics: string[] = [];
  const easyTopics: string[] = [];
  
  feedback.forEach((f: any) => {
    if (f.hardestQuestions) {
      try {
        const hard = typeof f.hardestQuestions === "string" ? JSON.parse(f.hardestQuestions) : f.hardestQuestions;
        if (Array.isArray(hard)) hardTopics.push(...hard.map((h: any) => h.topic || h.mitrePhase || "").filter(Boolean));
      } catch {}
    }
    if (f.easiestQuestions) {
      try {
        const easy = typeof f.easiestQuestions === "string" ? JSON.parse(f.easiestQuestions) : f.easiestQuestions;
        if (Array.isArray(easy)) easyTopics.push(...easy.map((e: any) => e.topic || e.mitrePhase || "").filter(Boolean));
      } catch {}
    }
  });

  const countOccurrences = (arr: string[]) => {
    const counts: Record<string, number> = {};
    arr.forEach((t) => { counts[t] = (counts[t] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);
  };

  return {
    theme: feedback[0]?.themesUsed?.[0] || "",
    difficulty: feedback[0]?.difficultyUsed || "",
    avgScorePercent: avgScore,
    hardestTopics: countOccurrences(hardTopics),
    easiestTopics: countOccurrences(easyTopics),
    sessionsCompleted: feedback.length,
  };
}
