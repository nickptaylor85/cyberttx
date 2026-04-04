import { PrismaClient, ToolCategory } from "@prisma/client";

const prisma = new PrismaClient();

const securityTools = [
  // EDR
  { name: "CrowdStrike Falcon", vendor: "CrowdStrike", category: ToolCategory.EDR, icon: "🦅" },
  { name: "Microsoft Defender for Endpoint", vendor: "Microsoft", category: ToolCategory.EDR, icon: "🛡️" },
  { name: "SentinelOne Singularity", vendor: "SentinelOne", category: ToolCategory.EDR, icon: "🤖" },
  { name: "Carbon Black", vendor: "VMware", category: ToolCategory.EDR, icon: "⚫" },
  { name: "Cortex XDR", vendor: "Palo Alto Networks", category: ToolCategory.EDR, icon: "🔶" },
  { name: "Trellix EDR", vendor: "Trellix", category: ToolCategory.EDR, icon: "🔴" },
  { name: "Cybereason", vendor: "Cybereason", category: ToolCategory.EDR, icon: "🧠" },
  { name: "Elastic Security", vendor: "Elastic", category: ToolCategory.EDR, icon: "🟡" },

  // Vulnerability Management
  { name: "Tenable.io", vendor: "Tenable", category: ToolCategory.VULNERABILITY_MANAGEMENT, icon: "🔍" },
  { name: "Tenable.sc", vendor: "Tenable", category: ToolCategory.VULNERABILITY_MANAGEMENT, icon: "🔍" },
  { name: "Qualys VMDR", vendor: "Qualys", category: ToolCategory.VULNERABILITY_MANAGEMENT, icon: "🎯" },
  { name: "Rapid7 InsightVM", vendor: "Rapid7", category: ToolCategory.VULNERABILITY_MANAGEMENT, icon: "⚡" },
  { name: "Microsoft Defender Vulnerability Management", vendor: "Microsoft", category: ToolCategory.VULNERABILITY_MANAGEMENT, icon: "🛡️" },
  { name: "Tanium", vendor: "Tanium", category: ToolCategory.VULNERABILITY_MANAGEMENT, icon: "🔗" },
  { name: "Wiz", vendor: "Wiz", category: ToolCategory.VULNERABILITY_MANAGEMENT, icon: "✨" },

  // SIEM
  { name: "Microsoft Sentinel", vendor: "Microsoft", category: ToolCategory.SIEM, icon: "🏰" },
  { name: "Splunk Enterprise Security", vendor: "Splunk", category: ToolCategory.SIEM, icon: "📊" },
  { name: "IBM QRadar", vendor: "IBM", category: ToolCategory.SIEM, icon: "🔵" },
  { name: "LogRhythm", vendor: "LogRhythm", category: ToolCategory.SIEM, icon: "📈" },
  { name: "Exabeam", vendor: "Exabeam", category: ToolCategory.SIEM, icon: "🧮" },
  { name: "Sumo Logic", vendor: "Sumo Logic", category: ToolCategory.SIEM, icon: "☁️" },
  { name: "Google Chronicle", vendor: "Google", category: ToolCategory.SIEM, icon: "📚" },

  // XDR
  { name: "Taegis XDR", vendor: "Secureworks", category: ToolCategory.XDR, icon: "🔮" },
  { name: "Trend Micro Vision One", vendor: "Trend Micro", category: ToolCategory.XDR, icon: "👁️" },
  { name: "Fortinet FortiXDR", vendor: "Fortinet", category: ToolCategory.XDR, icon: "🏯" },

  // SOAR
  { name: "Palo Alto XSOAR", vendor: "Palo Alto Networks", category: ToolCategory.SOAR, icon: "🚀" },
  { name: "Splunk SOAR", vendor: "Splunk", category: ToolCategory.SOAR, icon: "⚙️" },
  { name: "Tines", vendor: "Tines", category: ToolCategory.SOAR, icon: "🔧" },
  { name: "Swimlane", vendor: "Swimlane", category: ToolCategory.SOAR, icon: "🏊" },
  { name: "ServiceNow SecOps", vendor: "ServiceNow", category: ToolCategory.SOAR, icon: "🎫" },

  // Identity / PAM
  { name: "Microsoft Entra ID", vendor: "Microsoft", category: ToolCategory.IDENTITY, icon: "🆔" },
  { name: "Okta", vendor: "Okta", category: ToolCategory.IDENTITY, icon: "🔐" },
  { name: "Ping Identity", vendor: "Ping Identity", category: ToolCategory.IDENTITY, icon: "🏓" },
  { name: "CyberArk", vendor: "CyberArk", category: ToolCategory.PAM, icon: "🔒" },
  { name: "BeyondTrust", vendor: "BeyondTrust", category: ToolCategory.PAM, icon: "🗝️" },
  { name: "Delinea", vendor: "Delinea", category: ToolCategory.PAM, icon: "🏛️" },
  { name: "HashiCorp Vault", vendor: "HashiCorp", category: ToolCategory.PAM, icon: "🗄️" },

  // Email Security
  { name: "Proofpoint", vendor: "Proofpoint", category: ToolCategory.EMAIL_SECURITY, icon: "📧" },
  { name: "Mimecast", vendor: "Mimecast", category: ToolCategory.EMAIL_SECURITY, icon: "✉️" },
  { name: "Microsoft Defender for Office 365", vendor: "Microsoft", category: ToolCategory.EMAIL_SECURITY, icon: "📬" },
  { name: "Abnormal Security", vendor: "Abnormal Security", category: ToolCategory.EMAIL_SECURITY, icon: "🚫" },
  { name: "Barracuda", vendor: "Barracuda", category: ToolCategory.EMAIL_SECURITY, icon: "🐟" },

  // Network Security
  { name: "Zscaler ZIA", vendor: "Zscaler", category: ToolCategory.NETWORK_SECURITY, icon: "🌐" },
  { name: "Zscaler ZPA", vendor: "Zscaler", category: ToolCategory.NETWORK_SECURITY, icon: "🔗" },
  { name: "Palo Alto NGFW", vendor: "Palo Alto Networks", category: ToolCategory.NETWORK_SECURITY, icon: "🧱" },
  { name: "Cisco Meraki", vendor: "Cisco", category: ToolCategory.NETWORK_SECURITY, icon: "📡" },
  { name: "Fortinet FortiGate", vendor: "Fortinet", category: ToolCategory.NETWORK_SECURITY, icon: "🏰" },
  { name: "Cloudflare", vendor: "Cloudflare", category: ToolCategory.NETWORK_SECURITY, icon: "☁️" },

  // Cloud Security
  { name: "Prisma Cloud", vendor: "Palo Alto Networks", category: ToolCategory.CLOUD_SECURITY, icon: "🌤️" },
  { name: "AWS Security Hub", vendor: "Amazon", category: ToolCategory.CLOUD_SECURITY, icon: "🟠" },
  { name: "Microsoft Defender for Cloud", vendor: "Microsoft", category: ToolCategory.CLOUD_SECURITY, icon: "☁️" },
  { name: "Lacework", vendor: "Fortinet", category: ToolCategory.CLOUD_SECURITY, icon: "🕸️" },
  { name: "Orca Security", vendor: "Orca", category: ToolCategory.CLOUD_SECURITY, icon: "🐋" },

  // DLP
  { name: "Microsoft Purview", vendor: "Microsoft", category: ToolCategory.DLP, icon: "🟣" },
  { name: "Symantec DLP", vendor: "Broadcom", category: ToolCategory.DLP, icon: "🔏" },
  { name: "Digital Guardian", vendor: "Fortra", category: ToolCategory.DLP, icon: "🛡️" },
  { name: "Netskope", vendor: "Netskope", category: ToolCategory.DLP, icon: "🌊" },

  // WAF
  { name: "AWS WAF", vendor: "Amazon", category: ToolCategory.WAF, icon: "🟧" },
  { name: "Cloudflare WAF", vendor: "Cloudflare", category: ToolCategory.WAF, icon: "🛡️" },
  { name: "Imperva WAF", vendor: "Imperva", category: ToolCategory.WAF, icon: "🏛️" },
  { name: "F5 BIG-IP", vendor: "F5", category: ToolCategory.WAF, icon: "5️⃣" },

  // Threat Intelligence
  { name: "Recorded Future", vendor: "Recorded Future", category: ToolCategory.THREAT_INTELLIGENCE, icon: "📡" },
  { name: "Mandiant Advantage", vendor: "Google", category: ToolCategory.THREAT_INTELLIGENCE, icon: "🔥" },
  { name: "CrowdStrike Falcon Intelligence", vendor: "CrowdStrike", category: ToolCategory.THREAT_INTELLIGENCE, icon: "🦅" },
  { name: "VirusTotal", vendor: "Google", category: ToolCategory.THREAT_INTELLIGENCE, icon: "🦠" },
  { name: "AlienVault OTX", vendor: "AT&T", category: ToolCategory.THREAT_INTELLIGENCE, icon: "👽" },
];

async function main() {
  console.log("🌱 Seeding security tools...");

  for (const tool of securityTools) {
    await prisma.securityTool.upsert({
      where: { name: tool.name },
      update: tool,
      create: tool,
    });
  }

  console.log(`✅ Seeded ${securityTools.length} security tools`);

  // Create demo org for your team
  const demoOrg = await prisma.organization.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: "CyberTTX Demo",
      slug: "demo",
      plan: "FREE",
      isDemo: true,
      maxUsers: 50,
      maxTtxPerMonth: 999,
    },
  });

  console.log(`✅ Created demo org: ${demoOrg.name} (${demoOrg.slug})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
