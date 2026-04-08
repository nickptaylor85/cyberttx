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
  orgName?: string;
  characters?: Character[];
  pastPerformance?: PastPerformance | null;
  customIncident?: string;
  recentTitles?: string[];
  language?: string;
  threatActorContext?: string;
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

function buildCompanyContext(profile?: OrgProfile | null, orgName?: string): string {
  if (!profile || !profile.industry) return orgName ? `Company: ${orgName}. No detailed profile available — invent realistic details for a company called ${orgName} and make the scenario feel specific to them.` : "No company profile provided — invent a realistic UK-based company and make the scenario specific to them.";

  const parts: string[] = [];
  if (orgName) parts.push(`Company Name: ${orgName}`);
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

function repairJson(text: string): string {
  let s = text;
  
  // Remove trailing commas before } or ]
  s = s.replace(/,\s*([\]\}])/g, "$1");
  
  // Fix unescaped newlines inside strings
  s = s.replace(/(?<=": "(?:[^"\\]|\\.)*)\n(?=(?:[^"\\]|\\.)*")/g, "\\n");
  
  // Fix common escape issues
  s = s.replace(/\\'/g, "'");
  
  // If JSON is truncated, try to close it properly
  // Find the last complete question and truncate there
  const lastCompleteQ = s.lastIndexOf('"isCorrect"');
  if (lastCompleteQ > 0) {
    // Find the end of the question object after the last isCorrect
    let searchFrom = lastCompleteQ;
    let depth = 0;
    let foundEnd = false;
    // Look for the closing of the options array and question object
    for (let i = searchFrom; i < Math.min(searchFrom + 500, s.length); i++) {
      if (s[i] === '{') depth++;
      if (s[i] === '}') {
        depth--;
        if (depth <= -2) {
          // We've closed the option and question objects
          s = s.substring(0, i + 1);
          foundEnd = true;
          break;
        }
      }
    }
  }

  // Remove any trailing comma after truncation
  s = s.replace(/,\s*$/, "");
  
  // Count and close brackets
  let openBraces = (s.match(/\{/g) || []).length;
  let closeBraces = (s.match(/\}/g) || []).length;
  let openBrackets = (s.match(/\[/g) || []).length;
  let closeBrackets = (s.match(/\]/g) || []).length;
  
  while (openBrackets > closeBrackets) { s += "]"; closeBrackets++; }
  while (openBraces > closeBraces) { s += "}"; closeBraces++; }
  
  return s;
}

export async function generateTtxScenario(params: GenerateTtxParams): Promise<TtxScenario> {
  const {
    theme, difficulty, mitreAttackIds, securityTools, questionCount,
    orgProfile, characters, pastPerformance, customIncident, language, threatActorContext, orgName,
  } = params;

  const diffConfig = DIFFICULTY_CONFIG[difficulty];
  const toolsList = securityTools.length > 0
    ? securityTools.map((t) => `${t.name} (${t.vendor} - ${t.category})`).join("\n  - ")
    : "No specific tools configured — use generic security tooling";
  const mitreList = mitreAttackIds.length > 0 ? mitreAttackIds.join(", ") : "Choose appropriate techniques for the theme";
  const stageCount = Math.min(5, Math.max(3, Math.ceil(questionCount / 3)));
  const questionsPerStage = Math.ceil(questionCount / stageCount);

  const companyContext = buildCompanyContext(orgProfile, orgName);
  const characterContext = buildCharacterContext(characters);
  const learningContext = buildLearningContext(pastPerformance);

  const systemPrompt = `You are an elite cybersecurity tabletop exercise designer with 20+ years of experience. You create immersive, realistic TTX scenarios that feel like ACTUAL incidents happening to a SPECIFIC organization — never generic textbook exercises.

CRITICAL REALISM RULES:
Your scenarios MUST be grounded in real-world events and threat intelligence.


Base scenarios on real attack patterns. In each explanation, add ONE brief real-world reference like "📰 This happened at [Company] ([Year])." Keep it to one line.

RELATABILITY: Use realistic timestamps, show human reactions (panic, miscommunication), include business pressure. Make it feel real.

TARGET ORGANIZATION (USE THIS DATA — the scenario MUST be set at this specific company):
  ${companyContext}

CRITICAL: The scenario narrative MUST reference this company by name, use their actual industry context, mention their specific security tools, and reflect their team size and infrastructure. Do NOT use generic placeholder companies.
${characterContext}
${learningContext}

${customIncident ? `\nCUSTOM INCIDENT TO BASE SCENARIO ON:\n${customIncident}\n\nUse this real incident as the foundation. Adapt it to the target organization, add realistic details, and create decision-point questions based on the actual events described.` : ""}

${language && language !== "en" ? `
LANGUAGE REQUIREMENT:
Generate ALL content in the following language: ${language}.
This includes: scenario title, narrative text, stage descriptions, question text, answer options, explanations, and all other written content.
Technical terms (MITRE ATT&CK, CVE numbers, tool names) should remain in English.
` : ""}
RULES:
- Explanations: 1 sentence MAX. Be extremely concise.
- Exactly 4 options per question (A-D), exactly ONE correct
- Wrong options must be plausible
- Reference the org's security tools by name
- Include realistic timestamps and log excerpts
- Narrative escalates progressively
- If characters defined, use them by name
- Output ONLY valid JSON. No markdown. No trailing commas.

SCORING: Easy=${diffConfig.pointsEasy}, Medium=${diffConfig.pointsMedium}, Hard=${diffConfig.pointsHard} pts. Wrong=0.
AUDIENCE: ${diffConfig.description}

RESPONSE FORMAT: Return ONLY valid JSON. No markdown fences, no explanation.`;

  const userPrompt = `Create a cybersecurity TTX for ${orgName || "the target organisation"}:

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

  // Use Sonnet for reliable JSON generation
  let jsonText = "";
  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts++;
    const actualQuestionCount = attempts === 1 ? questionCount : Math.min(questionCount, 8);
    const actualPrompt = attempts === 1 ? userPrompt : userPrompt.replace(
      `QUESTIONS: ${questionCount}`,
      `QUESTIONS: ${actualQuestionCount} (KEEP IT SHORT — concise explanations only)`
    );

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: actualPrompt }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from AI");
    }

    jsonText = textContent.text.trim();

    // Check if output was truncated
    if (response.stop_reason === "end_turn") {
      console.log(`[generate] AI completed cleanly on attempt ${attempts} (${jsonText.length} chars)`);
      break;
    } else {
      console.warn(`[generate] AI output truncated on attempt ${attempts} (stop_reason: ${response.stop_reason}, ${jsonText.length} chars). ${attempts < maxAttempts ? "Retrying with fewer questions..." : "Using truncated output."}`);
      if (attempts >= maxAttempts) break;
    }
  }
  // Strip markdown fences
  jsonText = jsonText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  // Try to extract JSON object if there's extra text around it
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (jsonMatch) jsonText = jsonMatch[0];

  // Repair common JSON issues from AI output
  jsonText = repairJson(jsonText);

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
    console.error("Failed to parse AI response (first 500 chars):", jsonText.substring(0, 500));
    console.error("Failed to parse AI response (last 500 chars):", jsonText.substring(jsonText.length - 500));
    
    // Second attempt: try to extract partial valid JSON
    try {
      // Find the last valid stage boundary
      const stageMatches = [...jsonText.matchAll(/"stageNumber"\s*:\s*(\d+)/g)];
      if (stageMatches.length >= 2) {
        // Try truncating to the second-to-last stage
        const lastStageStart = stageMatches[stageMatches.length - 1].index!;
        const truncated = repairJson(jsonText.substring(0, lastStageStart - 1));
        const scenario: TtxScenario = JSON.parse(truncated);
        console.log("Recovered partial scenario with", scenario.stages?.length, "stages");
        let calculatedTotal = 0;
        scenario.stages?.forEach((stage: TtxStage) => {
          stage.questions?.forEach((q) => {
            const correctOption = q.options?.find((o) => o.isCorrect);
            if (correctOption) calculatedTotal += correctOption.points || 0;
          });
        });
        scenario.totalPoints = calculatedTotal;
        return scenario;
      }
    } catch {}
    
    throw new Error("Failed to parse TTX scenario — try with fewer questions or a simpler theme");
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
