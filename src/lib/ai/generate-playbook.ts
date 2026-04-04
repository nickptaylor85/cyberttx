import Anthropic from "@anthropic-ai/sdk";
import type { TtxScenario } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface PlaybookParams {
  scenario: TtxScenario;
  orgProfile: any;
  securityTools: string[];
  performanceData: {
    avgScorePercent: number;
    weakAreas: string[];
    strongAreas: string[];
  };
  framework: string;
}

export async function generatePlaybook(params: PlaybookParams) {
  const { scenario, orgProfile, securityTools, performanceData, framework } = params;

  const systemPrompt = `You are a senior cybersecurity consultant creating an incident response playbook based on a tabletop exercise that was just completed. The playbook should be practical, actionable, and specific to the organization's environment and tooling.

Generate a comprehensive playbook in JSON format that security teams can immediately reference during a real incident.

RESPONSE FORMAT: Return ONLY valid JSON, no markdown fences.`;

  const userPrompt = `Generate an incident response playbook based on this completed TTX:

SCENARIO: ${scenario.title}
OVERVIEW: ${scenario.overview}
THREAT TYPE: ${scenario.attackerProfile.type} (${scenario.attackerProfile.sophistication} sophistication)
ATTACK VECTOR: ${scenario.stages.map(s => s.mitrePhase).join(" → ")}
MITRE TECHNIQUES: ${scenario.stages.flatMap(s => s.mitreTechniques).join(", ")}

ORGANIZATION'S SECURITY TOOLS: ${securityTools.join(", ") || "Generic tooling"}
INDUSTRY: ${orgProfile?.industry || "Not specified"}
COMPLIANCE: ${orgProfile?.complianceFrameworks?.join(", ") || "Not specified"}

TEAM PERFORMANCE:
- Average score: ${performanceData.avgScorePercent}%
- Weak areas (need extra detail): ${performanceData.weakAreas.join(", ") || "None identified"}
- Strong areas: ${performanceData.strongAreas.join(", ") || "None identified"}

FRAMEWORK: ${framework}

Return this JSON structure:
{
  "title": "string - playbook title",
  "summary": "string - executive summary",
  "scope": "string - what incidents this covers",
  "severity_classification": {
    "critical": "string - criteria",
    "high": "string - criteria",
    "medium": "string - criteria",
    "low": "string - criteria"
  },
  "roles_and_responsibilities": [
    { "role": "string", "responsibilities": ["string"], "escalation_contact": "string" }
  ],
  "phases": [
    {
      "phase_number": 1,
      "name": "string - e.g. Detection & Analysis",
      "objective": "string",
      "steps": [
        {
          "step_number": 1,
          "action": "string - specific action to take",
          "tool": "string - which security tool to use",
          "detail": "string - how to do it specifically",
          "time_target": "string - e.g. Within 15 minutes"
        }
      ],
      "decision_points": [
        { "condition": "string", "action_if_true": "string", "action_if_false": "string" }
      ]
    }
  ],
  "communication_plan": {
    "internal_notifications": ["string"],
    "external_notifications": ["string"],
    "templates": [
      { "name": "string", "audience": "string", "template": "string" }
    ]
  },
  "containment_strategies": [
    { "strategy": "string", "when_to_use": "string", "tools_required": ["string"], "steps": ["string"] }
  ],
  "evidence_collection": [
    { "source": "string", "tool": "string", "command_or_procedure": "string", "priority": "string" }
  ],
  "recovery_steps": [
    { "step": "string", "responsible": "string", "verification": "string" }
  ],
  "lessons_learned_from_ttx": {
    "gaps_identified": ["string - based on wrong answers and weak areas"],
    "recommendations": ["string - specific improvements"],
    "training_needs": ["string"]
  },
  "appendix": {
    "key_iocs_from_scenario": ["string"],
    "relevant_mitre_techniques": ["string"],
    "regulatory_requirements": ["string"]
  }
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 6000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") throw new Error("No response");

  let jsonText = textContent.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(jsonText);
}
