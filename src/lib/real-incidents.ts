// Real-world incidents mapped to themes and MITRE techniques
// Shown after each question explanation to anchor learning in reality

export interface RealIncident {
  title: string;
  year: number;
  summary: string;
  technique?: string;
  theme: string;
}

export const REAL_INCIDENTS: RealIncident[] = [
  // Ransomware
  { title: "Change Healthcare / ALPHV", year: 2024, summary: "BlackCat ransomware crippled US healthcare payments for weeks. Attackers used stolen credentials to bypass MFA and deploy ransomware across the network.", theme: "ransomware" },
  { title: "Royal Mail / LockBit", year: 2023, summary: "LockBit ransomware paralysed Royal Mail international deliveries. The gang demanded £66M and leaked stolen data when payment was refused.", theme: "ransomware" },
  { title: "Colonial Pipeline / DarkSide", year: 2021, summary: "A single compromised VPN password shut down the largest US fuel pipeline for 6 days. The company paid $4.4M in Bitcoin ransom.", theme: "ransomware" },
  { title: "Maersk / NotPetya", year: 2017, summary: "NotPetya destroyed 49,000 laptops and 1,000 applications at Maersk. Recovery required reinstalling the entire IT infrastructure from scratch — $300M in damages.", theme: "ransomware" },

  // Phishing / Social Engineering
  { title: "MGM Resorts / Scattered Spider", year: 2023, summary: "A 10-minute phone call to the helpdesk impersonating an employee gave attackers full access. They shut down casino operations for days — $100M+ in losses.", theme: "phishing" },
  { title: "Twilio / SMS Phishing", year: 2022, summary: "Employees received fake SMS messages mimicking IT login pages. Stolen credentials were used to access customer data across 130+ downstream companies.", theme: "phishing" },
  { title: "Twitter / Phone Spear Phishing", year: 2020, summary: "Attackers called Twitter employees posing as IT, convincing them to enter credentials on a fake VPN page. They hijacked high-profile accounts including Elon Musk and Barack Obama.", theme: "phishing" },

  // Supply Chain
  { title: "3CX / Lazarus Group", year: 2023, summary: "North Korean hackers trojanised the 3CX desktop app update, compromising 600,000+ organisations through a legitimate software update channel.", theme: "supply-chain" },
  { title: "SolarWinds / Nobelium", year: 2020, summary: "Russian intelligence inserted a backdoor into SolarWinds Orion updates. 18,000 organisations installed the trojanised update, including US government agencies.", theme: "supply-chain" },
  { title: "Kaseya / REvil", year: 2021, summary: "REvil exploited Kaseya VSA servers to push ransomware to 1,500+ downstream businesses simultaneously through managed service providers.", theme: "supply-chain" },

  // APT / Nation State
  { title: "Microsoft / Storm-0558", year: 2023, summary: "Chinese threat actors forged Azure AD tokens using a stolen signing key. They accessed government email accounts at the State Department and Commerce Department.", theme: "apt" },
  { title: "FireEye / SolarWinds APT", year: 2020, summary: "APT29 (Cozy Bear) breached FireEye itself — a top cybersecurity firm — stealing their red team tools before the SolarWinds campaign was discovered.", theme: "apt" },

  // Insider Threat
  { title: "Tesla / Employee Data Theft", year: 2023, summary: "Two former employees leaked personal data of 75,000+ workers to a German newspaper. The breach included SSNs, salaries, and production secrets.", theme: "insider-threat" },
  { title: "Capital One / Cloud Insider", year: 2019, summary: "A former AWS employee exploited a misconfigured WAF to access Capital One's S3 buckets, exposing 100M+ customer records.", theme: "insider-threat" },

  // Cloud Breach
  { title: "Okta / Support System Breach", year: 2023, summary: "Attackers accessed Okta's support case management system and stole customer session tokens from HAR files uploaded for troubleshooting.", theme: "cloud-breach" },
  { title: "Uber / AWS Secrets in Code", year: 2022, summary: "An attacker social-engineered an employee's MFA, then found hardcoded AWS credentials in PowerShell scripts to access Uber's cloud infrastructure.", theme: "cloud-breach" },

  // Data Exfiltration
  { title: "MOVEit / CL0P", year: 2023, summary: "CL0P exploited a zero-day in MOVEit Transfer to steal data from thousands of organisations in a single campaign, including Shell, BBC, and the US Department of Energy.", theme: "data-exfil" },
  { title: "Snowflake Customer Breaches", year: 2024, summary: "Attackers used stolen credentials (no MFA) to access Snowflake customer instances, exfiltrating data from AT&T, Ticketmaster, and Santander affecting hundreds of millions.", theme: "data-exfil" },

  // DDoS
  { title: "AWS / Largest DDoS Ever", year: 2020, summary: "Amazon mitigated a 2.3 Tbps DDoS attack — the largest ever recorded at the time — targeting an unnamed AWS customer using CLDAP reflection.", theme: "ddos" },
  { title: "Dyn DNS / Mirai Botnet", year: 2016, summary: "The Mirai botnet hijacked IoT devices to attack Dyn DNS, taking down Twitter, Netflix, Reddit, and GitHub for hours.", theme: "ddos" },

  // Network / Zero-Day
  { title: "Cisco IOS XE / CVE-2023-20198", year: 2023, summary: "A critical zero-day was exploited to create admin accounts on tens of thousands of Cisco devices worldwide before a patch was available.", theme: "ransomware", technique: "T1190" },
  { title: "Barracuda ESG / UNC4841", year: 2023, summary: "Chinese espionage group exploited a Barracuda Email Security Gateway zero-day for months. The fix was: replace the physical hardware entirely.", theme: "supply-chain", technique: "T1190" },
];

// Get 1-2 relevant incidents for a given theme
export function getIncidentsForTheme(theme: string): RealIncident[] {
  const matches = REAL_INCIDENTS.filter(i => i.theme === theme);
  // Shuffle and pick 2
  return matches.sort(() => Math.random() - 0.5).slice(0, 2);
}

// Get a single random incident for a theme (for after-question display)
export function getRandomIncident(theme: string): RealIncident | null {
  const matches = REAL_INCIDENTS.filter(i => i.theme === theme);
  return matches.length > 0 ? matches[Math.floor(Math.random() * matches.length)] : null;
}
