// ============================================
// TTX SCENARIO (AI-Generated)
// ============================================

export interface TtxScenario {
  title: string;
  overview: string;
  attackerProfile: {
    name: string;
    type: string; // APT, Hacktivist, Insider, Criminal
    motivation: string;
    sophistication: string;
  };
  targetOrganization: {
    industry: string;
    size: string;
    description: string;
  };
  stages: TtxStage[];
  totalPoints: number;
}

export interface TtxStage {
  stageNumber: number;
  title: string; // e.g., "Stage 1: Initial Access"
  mitrePhase: string; // MITRE ATT&CK phase
  mitreTechniques: string[]; // T-codes
  narrative: string; // The unfolding story
  iocIndicators?: string[]; // Indicators of compromise shown
  alertsTriggered?: AlertInfo[]; // Simulated tool alerts
  questions: TtxQuestion[];
}

export interface AlertInfo {
  tool: string; // The security tool that fired
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
}

export interface TtxQuestion {
  questionIndex: number;
  question: string;
  context?: string; // Additional context (e.g., log excerpt, alert detail)
  options: TtxOption[];
  explanation: string; // Shown after answering
  difficulty: "easy" | "medium" | "hard";
}

export interface TtxOption {
  index: number;
  text: string;
  isCorrect: boolean;
  points: number; // 0 for wrong, 100/200/300 based on difficulty
}

// ============================================
// MITRE ATT&CK REFERENCE
// ============================================

export interface MitreTechnique {
  id: string;
  name: string;
  tactic: string;
  description?: string;
}

export const MITRE_TACTICS = [
  "Reconnaissance",
  "Resource Development",
  "Initial Access",
  "Execution",
  "Persistence",
  "Privilege Escalation",
  "Defense Evasion",
  "Credential Access",
  "Discovery",
  "Lateral Movement",
  "Collection",
  "Command and Control",
  "Exfiltration",
  "Impact",
] as const;

export const COMMON_MITRE_TECHNIQUES: MitreTechnique[] = [
  { id: "T1566", name: "Phishing", tactic: "Initial Access" },
  { id: "T1566.001", name: "Spearphishing Attachment", tactic: "Initial Access" },
  { id: "T1566.002", name: "Spearphishing Link", tactic: "Initial Access" },
  { id: "T1190", name: "Exploit Public-Facing Application", tactic: "Initial Access" },
  { id: "T1133", name: "External Remote Services", tactic: "Initial Access" },
  { id: "T1078", name: "Valid Accounts", tactic: "Initial Access" },
  { id: "T1059", name: "Command and Scripting Interpreter", tactic: "Execution" },
  { id: "T1059.001", name: "PowerShell", tactic: "Execution" },
  { id: "T1204", name: "User Execution", tactic: "Execution" },
  { id: "T1053", name: "Scheduled Task/Job", tactic: "Persistence" },
  { id: "T1547", name: "Boot or Logon Autostart Execution", tactic: "Persistence" },
  { id: "T1548", name: "Abuse Elevation Control Mechanism", tactic: "Privilege Escalation" },
  { id: "T1068", name: "Exploitation for Privilege Escalation", tactic: "Privilege Escalation" },
  { id: "T1070", name: "Indicator Removal", tactic: "Defense Evasion" },
  { id: "T1027", name: "Obfuscated Files or Information", tactic: "Defense Evasion" },
  { id: "T1003", name: "OS Credential Dumping", tactic: "Credential Access" },
  { id: "T1110", name: "Brute Force", tactic: "Credential Access" },
  { id: "T1558", name: "Steal or Forge Kerberos Tickets", tactic: "Credential Access" },
  { id: "T1021", name: "Remote Services", tactic: "Lateral Movement" },
  { id: "T1021.001", name: "Remote Desktop Protocol", tactic: "Lateral Movement" },
  { id: "T1570", name: "Lateral Tool Transfer", tactic: "Lateral Movement" },
  { id: "T1005", name: "Data from Local System", tactic: "Collection" },
  { id: "T1071", name: "Application Layer Protocol", tactic: "Command and Control" },
  { id: "T1105", name: "Ingress Tool Transfer", tactic: "Command and Control" },
  { id: "T1041", name: "Exfiltration Over C2 Channel", tactic: "Exfiltration" },
  { id: "T1486", name: "Data Encrypted for Impact", tactic: "Impact" },
  { id: "T1490", name: "Inhibit System Recovery", tactic: "Impact" },
  { id: "T1489", name: "Service Stop", tactic: "Impact" },
  { id: "T1498", name: "Network Denial of Service", tactic: "Impact" },
];

// ============================================
// TTX THEMES
// ============================================

export const TTX_THEMES = [
  { id: "ransomware", name: "Ransomware Attack", icon: "🔐", description: "Encryption-based extortion campaign" },
  { id: "apt", name: "Advanced Persistent Threat", icon: "🕵️", description: "Nation-state level intrusion" },
  { id: "insider-threat", name: "Insider Threat", icon: "👤", description: "Malicious or negligent insider" },
  { id: "supply-chain", name: "Supply Chain Attack", icon: "🔗", description: "Third-party compromise" },
  { id: "bec", name: "Business Email Compromise", icon: "📧", description: "Social engineering via email" },
  { id: "cloud-breach", name: "Cloud Infrastructure Breach", icon: "☁️", description: "Cloud environment compromise" },
  { id: "zero-day", name: "Zero-Day Exploitation", icon: "💣", description: "Unknown vulnerability exploitation" },
  { id: "data-exfil", name: "Data Exfiltration", icon: "📤", description: "Sensitive data theft" },
  { id: "ddos", name: "DDoS Attack", icon: "🌊", description: "Distributed denial of service" },
  { id: "iot-attack", name: "IoT / OT Attack", icon: "🏭", description: "Operational technology compromise" },
  { id: "credential-stuffing", name: "Credential Stuffing", icon: "🔑", description: "Automated credential abuse" },
  { id: "watering-hole", name: "Watering Hole Attack", icon: "💧", description: "Strategic website compromise" },
  // ── Real-World Incident Reconstructions ──
  { id: "solarwinds", name: "SolarWinds-Style Supply Chain", icon: "🔥", description: "Software supply chain compromise affecting thousands of orgs" },
  { id: "log4shell", name: "Log4Shell Exploitation", icon: "🔥", description: "Critical RCE via logging library (CVE-2021-44228)" },
  { id: "moveit", name: "MOVEit Zero-Day Campaign", icon: "🔥", description: "Mass exploitation of file transfer vulnerability by Cl0p" },
  { id: "healthcare-ransomware", name: "Healthcare Ransomware", icon: "🔥", description: "NHS-style attack disrupting patient care and clinical systems" },
  { id: "retail-attack", name: "UK Retail Ransomware", icon: "🔥", description: "M&S/Co-op-style coordinated retail sector campaign" },
  { id: "jlr-supply-chain", name: "Automotive Supply Chain", icon: "🔥", description: "JLR-style attack halting manufacturing via supplier compromise" },
  { id: "crowdstrike-outage", name: "Security Tool Outage", icon: "🔥", description: "CrowdStrike-style faulty update causing global IT outage" },
  { id: "okta-breach", name: "Identity Provider Breach", icon: "🔥", description: "IdP compromise enabling downstream customer access" },
  { id: "deepfake-bec", name: "AI Deepfake BEC", icon: "🔥", description: "AI-generated voice/video impersonation of executives" },
] as const;

// ============================================
// PLAN LIMITS
// ============================================

export const PLAN_LIMITS = {
  FREE: { maxUsers: 5, maxTtxPerMonth: 3, features: ["basic_themes", "individual_mode"] },
  STARTER: { maxUsers: 15, maxTtxPerMonth: 15, features: ["all_themes", "individual_mode", "group_mode", "leaderboard"] },
  PROFESSIONAL: { maxUsers: 50, maxTtxPerMonth: 50, features: ["all_themes", "all_modes", "leaderboard", "pdf_export", "custom_scenarios"] },
  ENTERPRISE: { maxUsers: 500, maxTtxPerMonth: 999, features: ["all_themes", "all_modes", "leaderboard", "pdf_export", "custom_scenarios", "api_access", "sso"] },
} as const;

// ============================================
// REAL-TIME EVENTS
// ============================================

export interface PlayerJoinedEvent {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface PlayerAnsweredEvent {
  userId: string;
  stageIndex: number;
  questionIndex: number;
  isCorrect: boolean;
  points: number;
  totalScore: number;
}

export interface StageAdvanceEvent {
  stageIndex: number;
  stage: TtxStage;
}

export interface ScoreUpdateEvent {
  leaderboard: {
    userId: string;
    firstName: string;
    lastName: string;
    totalScore: number;
    rank: number;
  }[];
}

export interface SessionCompletedEvent {
  finalLeaderboard: ScoreUpdateEvent["leaderboard"];
  sessionId: string;
}
