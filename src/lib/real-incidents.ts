// ═══════════════════════════════════════════════════════════════
// REAL-WORLD BREACH DATABASE
// 75+ incidents with TTPs, IOCs, timelines, and MITRE mappings
// Used by the AI to ground exercises in reality
// ═══════════════════════════════════════════════════════════════

export interface RealIncident {
  title: string;
  year: number;
  summary: string;
  theme: string;
  techniques?: string[];        // MITRE ATT&CK T-codes
  ttps?: string[];              // Human-readable TTPs
  iocs?: string[];              // Example IOCs (sanitised)
  timeline?: string;            // Key timeline facts
  impact?: string;              // Business/financial impact
  lessonsLearned?: string;      // Key takeaway
  sector?: string;              // Industry sector affected
}

export const REAL_INCIDENTS: RealIncident[] = [
  // ═══ RANSOMWARE (15) ═══
  { title: "Change Healthcare / ALPHV", year: 2024, theme: "ransomware", sector: "Healthcare",
    summary: "BlackCat ransomware crippled US healthcare payments for weeks via stolen credentials bypassing MFA.",
    techniques: ["T1078", "T1486", "T1490"], ttps: ["Credential theft", "MFA bypass", "Ransomware deployment", "Backup destruction"],
    iocs: ["BlackCat/ALPHV encryptor", "Cobalt Strike beacons on domain controllers"],
    timeline: "Attackers had access for 9 days before encryption. Payment systems down for 3+ weeks.",
    impact: "$872M in losses. 100M+ patient records exposed. UnitedHealth paid $22M ransom.",
    lessonsLearned: "Legacy systems without MFA are the #1 ransomware entry point." },

  { title: "Royal Mail / LockBit", year: 2023, theme: "ransomware", sector: "Logistics",
    summary: "LockBit paralysed Royal Mail international deliveries for 6 weeks. £66M ransom demanded.",
    techniques: ["T1190", "T1486", "T1489"], ttps: ["Exploitation of public-facing app", "Service encryption", "Demand via dark web blog"],
    impact: "6 weeks of disrupted international mail. £66M ransom demanded, refused. Data leaked.",
    lessonsLearned: "Have an offline backup and tested restoration plan. Negotiate to buy time." },

  { title: "Colonial Pipeline / DarkSide", year: 2021, theme: "ransomware", sector: "Energy",
    summary: "A single compromised VPN password shut down the largest US fuel pipeline for 6 days.",
    techniques: ["T1078", "T1486"], ttps: ["Compromised VPN credentials", "No MFA on VPN", "IT/OT network bridged"],
    timeline: "Attackers accessed IT network via VPN. Colonial shut OT as a precaution — not because OT was hit.",
    impact: "$4.4M ransom paid (partially recovered). Fuel shortages across US East Coast.",
    lessonsLearned: "Segment IT and OT networks. MFA on every remote access point." },

  { title: "Maersk / NotPetya", year: 2017, theme: "ransomware", sector: "Maritime/Logistics",
    summary: "NotPetya destroyed 49,000 laptops, 1,000+ applications, and all domain controllers at Maersk.",
    techniques: ["T1195.002", "T1210", "T1486"], ttps: ["Supply chain via MeDoc update", "EternalBlue propagation", "Wiper disguised as ransomware"],
    timeline: "Entire global IT infrastructure destroyed in 7 minutes. Rebuilt from scratch in 10 days.",
    impact: "$300M in damages. One surviving domain controller found in Ghana (offline during attack).",
    lessonsLearned: "NotPetya was a wiper, not ransomware. Offline backups saved the company." },

  { title: "NHS / WannaCry", year: 2017, theme: "ransomware", sector: "Healthcare",
    summary: "WannaCry ransomware shut down 80+ NHS trusts, cancelling 19,000 appointments in one day.",
    techniques: ["T1210", "T1486"], ttps: ["EternalBlue SMBv1 exploitation", "Worm-like propagation", "No segmentation"],
    impact: "19,000 appointments cancelled. £92M estimated cost. Ambulances diverted.",
    lessonsLearned: "Patch management and network segmentation are non-negotiable in healthcare." },

  { title: "Synnovis / Qilin", year: 2024, theme: "ransomware", sector: "Healthcare",
    summary: "Qilin ransomware hit NHS pathology provider Synnovis, disrupting blood tests across London hospitals.",
    techniques: ["T1078", "T1486", "T1567"], ttps: ["Initial access via VPN credentials", "Data exfiltration before encryption"],
    impact: "Blood transfusions disrupted. 10,000+ acute outpatient appointments affected. 400GB data leaked.",
    lessonsLearned: "Third-party providers are a critical dependency. Test your supply chain resilience." },

  { title: "JBS Foods / REvil", year: 2021, theme: "ransomware", sector: "Food/Agriculture",
    summary: "REvil shut down the world's largest meat processor, affecting 20% of US beef production.",
    techniques: ["T1078", "T1486"], impact: "$11M ransom paid. Plants closed in US, Canada, Australia.",
    lessonsLearned: "Critical infrastructure includes food supply chains, not just energy and healthcare." },

  { title: "Rackspace / Play Ransomware", year: 2022, theme: "ransomware", sector: "Cloud/MSP",
    summary: "Play ransomware encrypted Rackspace hosted Exchange servers via ProxyNotShell exploit.",
    techniques: ["T1190", "T1486"], impact: "Thousands of customers lost email access. Rackspace retired the Exchange product entirely.",
    lessonsLearned: "Hosted/managed services are a single point of failure. Have email continuity plans." },

  { title: "Ion Group / LockBit", year: 2023, theme: "ransomware", sector: "Financial Services",
    summary: "LockBit hit Ion Group's cleared derivatives platform, forcing banks to process trades manually.",
    techniques: ["T1486"], impact: "Major banks including ABN Amro and Intesa Sanpaolo affected. Manual trade processing for days.",
    lessonsLearned: "Financial infrastructure dependencies are deeply interconnected." },

  { title: "Costa Rica Government / Conti", year: 2022, theme: "ransomware", sector: "Government",
    summary: "Conti ransomware attacked Costa Rica's government, causing a national emergency declaration.",
    techniques: ["T1566", "T1486", "T1567"], impact: "National emergency declared. Tax and customs systems down for months. $20M demanded.",
    lessonsLearned: "Nation-state attacks on government IT can cripple an entire country's operations." },

  { title: "British Library / Rhysida", year: 2023, theme: "ransomware", sector: "Public Sector",
    summary: "Rhysida ransomware encrypted the British Library's systems, destroying the main catalogue.",
    techniques: ["T1078", "T1486", "T1567"], impact: "Catalogue offline for months. 600GB data leaked on dark web. £6-7M recovery cost.",
    lessonsLearned: "Cultural institutions are targets too. Legacy systems are especially vulnerable." },

  { title: "Caesars / Scattered Spider", year: 2023, theme: "ransomware", sector: "Hospitality",
    summary: "Scattered Spider hit Caesars Entertainment via social engineering — Caesars paid $15M ransom quietly.",
    techniques: ["T1566", "T1078", "T1486"], impact: "$15M ransom paid. Loyalty programme data stolen. Disclosed weeks after MGM attack.",
    lessonsLearned: "Paying ransom is no guarantee of data deletion. The same group hit MGM simultaneously." },

  { title: "Clorox / Unknown", year: 2023, theme: "ransomware", sector: "Consumer Goods",
    summary: "A cyberattack forced Clorox to process orders manually for weeks, causing product shortages.",
    techniques: ["T1486"], impact: "$356M in damages. Market share lost to competitors during outage.",
    lessonsLearned: "Manufacturing and supply chain disruption has cascading competitive impact." },

  { title: "MOVEit / Cl0p", year: 2023, theme: "ransomware", sector: "Cross-sector",
    summary: "Cl0p exploited MOVEit Transfer zero-day to steal data from 2,500+ organisations in a mass campaign.",
    techniques: ["T1190", "T1567"], ttps: ["SQL injection zero-day", "Mass automated exploitation", "Data theft without encryption"],
    impact: "2,500+ orgs affected including Shell, BBC, US DoE. 62M+ individuals' data stolen.",
    lessonsLearned: "Mass exploitation of file transfer tools is the new supply chain attack vector." },

  { title: "DP World Australia", year: 2023, theme: "ransomware", sector: "Maritime/Logistics",
    summary: "Cyberattack on DP World shut down port operations across Australia for 3 days.",
    techniques: ["T1190", "T1486"], impact: "30,000 shipping containers stranded. Trade disruption across 4 major ports.",
    lessonsLearned: "Port infrastructure is critical national infrastructure. OT/IT convergence creates risk." },

  // ═══ PHISHING / SOCIAL ENGINEERING (10) ═══
  { title: "MGM Resorts / Scattered Spider", year: 2023, theme: "phishing", sector: "Hospitality",
    summary: "A 10-minute helpdesk call impersonating an employee gave attackers full Okta and Azure access.",
    techniques: ["T1566.004", "T1078", "T1098"], ttps: ["Vishing (voice phishing)", "Helpdesk impersonation", "MFA fatigue", "Identity provider takeover"],
    timeline: "Call to helpdesk → Okta compromise → Azure takeover → ESXi encryption in under 5 hours.",
    impact: "$100M+ in losses. Casino floors dark. Hotel keycards stopped working. 10 days to recover.",
    lessonsLearned: "Helpdesk verification procedures are your identity perimeter." },

  { title: "Twilio / SMS Phishing", year: 2022, theme: "phishing", sector: "Technology",
    summary: "Fake SMS messages mimicked IT login pages, compromising 130+ downstream companies via Twilio.",
    techniques: ["T1566.001", "T1078"], impact: "Signal, Okta, and 130+ companies affected downstream.",
    lessonsLearned: "SMS is not a secure second factor. Phishing-resistant MFA (FIDO2) stops this." },

  { title: "Twitter / Phone Spear Phishing", year: 2020, theme: "phishing", sector: "Technology",
    summary: "Attackers called Twitter employees posing as IT, hijacking accounts of Musk, Obama, and others.",
    techniques: ["T1566.004", "T1078"], impact: "$120K in Bitcoin stolen. Massive reputational damage.",
    lessonsLearned: "Internal tools must have privileged access controls, not just perimeter security." },

  { title: "Reddit / Phishing", year: 2023, theme: "phishing", sector: "Technology",
    summary: "A targeted phishing email led an employee to a cloned intranet page, exposing internal docs.",
    techniques: ["T1566.001", "T1078"], impact: "Internal code, documents, and business systems accessed.",
    lessonsLearned: "Even security-aware tech companies get phished. Speed of detection matters." },

  { title: "Cisco / Voice Phishing + MFA Fatigue", year: 2022, theme: "phishing", sector: "Technology",
    summary: "Yanluowang group used voice phishing and MFA push fatigue to breach Cisco's corporate VPN.",
    techniques: ["T1566.004", "T1621", "T1078"], ttps: ["Vishing", "MFA fatigue bombing", "VPN credential theft"],
    impact: "2.8GB of data stolen from Cisco's network. Published on dark web.",
    lessonsLearned: "MFA push notifications are vulnerable to fatigue attacks. Use number matching." },

  { title: "Uber / Social Engineering + MFA Fatigue", year: 2022, theme: "phishing", sector: "Technology",
    summary: "An 18-year-old bought stolen credentials, MFA-bombed an employee, then found AWS keys in scripts.",
    techniques: ["T1566", "T1621", "T1552"], ttps: ["Purchased credentials", "MFA fatigue", "Credential in code", "Slack impersonation"],
    timeline: "MFA fatigue → employee accepted → Slack access → hardcoded AWS creds in PowerShell → full cloud access.",
    impact: "Full access to Uber's AWS, GCP, SentinelOne, Slack, and HackerOne bug bounty reports.",
    lessonsLearned: "Hardcoded credentials in scripts are an existential risk. Secrets management is essential." },

  { title: "Mailchimp / Social Engineering", year: 2023, theme: "phishing", sector: "Technology",
    summary: "Repeated social engineering attacks on Mailchimp employees compromised 133 customer accounts.",
    techniques: ["T1566.004", "T1078"], impact: "133 customer accounts accessed. Repeat attack — third incident in 12 months.",
    lessonsLearned: "Repeat targeting happens. Post-incident security improvements must actually work." },

  { title: "Retool / SMS Phishing + Deepfake Voice", year: 2023, theme: "phishing", sector: "Technology",
    summary: "Attackers used SMS phishing followed by a deepfake voice call impersonating an IT employee.",
    techniques: ["T1566.001", "T1566.004"], ttps: ["SMS phishing", "Deepfake voice impersonation", "Google Authenticator cloud sync exploit"],
    impact: "27 crypto customer accounts accessed via Retool's admin tools.",
    lessonsLearned: "Deepfake voice is now a real attack vector. Google Authenticator cloud sync creates risk." },

  { title: "Microsoft / Midnight Blizzard Phishing", year: 2024, theme: "phishing", sector: "Technology",
    summary: "Russian APT sent phishing emails with RDP config files to thousands of targets across 100+ orgs.",
    techniques: ["T1566.001", "T1021.001"], ttps: ["Weaponised RDP configuration files", "Mass phishing campaign"],
    impact: "Targeted government, defence, academic, and NGO sectors globally.",
    lessonsLearned: "RDP config files are a novel phishing payload — email gateways may not flag them." },

  { title: "Activision / SMS Phishing", year: 2023, theme: "phishing", sector: "Gaming",
    summary: "An HR employee was SMS-phished, exposing employee data and upcoming game release schedules.",
    techniques: ["T1566.001", "T1078"], impact: "Employee PII and unreleased game content leaked.",
    lessonsLearned: "HR systems are high-value targets — they hold PII for the entire workforce." },

  // ═══ SUPPLY CHAIN (8) ═══
  { title: "SolarWinds / Nobelium (APT29)", year: 2020, theme: "supply-chain", sector: "Cross-sector",
    summary: "Russian intelligence inserted a backdoor into SolarWinds Orion updates, hitting 18,000 organisations.",
    techniques: ["T1195.002", "T1071", "T1027"], ttps: ["Trojanised software update", "C2 via DNS", "Living off the land"],
    timeline: "Backdoor inserted Feb 2020. Discovered Dec 2020 by FireEye. 9-month dwell time.",
    impact: "18,000 orgs installed backdoor. US Treasury, Commerce, Homeland Security compromised.",
    lessonsLearned: "Software supply chain integrity is a national security issue." },

  { title: "3CX / Lazarus Group", year: 2023, theme: "supply-chain", sector: "Technology",
    summary: "North Korean hackers trojanised the 3CX desktop app via a cascading supply chain attack (Trading Technologies → 3CX).",
    techniques: ["T1195.002", "T1059"], ttps: ["Supply chain of supply chains", "DLL sideloading"],
    impact: "600,000+ organisations at risk. First known case of one supply chain attack leading to another.",
    lessonsLearned: "Supply chain attacks can cascade — your vendor's vendor is also your attack surface." },

  { title: "Kaseya / REvil", year: 2021, theme: "supply-chain", sector: "MSP",
    summary: "REvil exploited Kaseya VSA to push ransomware to 1,500+ businesses through their MSPs.",
    techniques: ["T1190", "T1195.002", "T1486"], impact: "1,500+ businesses encrypted simultaneously via 60 MSPs.",
    lessonsLearned: "MSPs are force multipliers — for attackers as well as defenders." },

  { title: "Codecov / Supply Chain", year: 2021, theme: "supply-chain", sector: "Technology",
    summary: "Attackers modified Codecov's Bash Uploader script to steal CI/CD environment variables and secrets.",
    techniques: ["T1195.002", "T1552"], impact: "Secrets from thousands of CI/CD pipelines exfiltrated over 2 months.",
    lessonsLearned: "CI/CD pipelines contain the keys to the kingdom. Verify script integrity." },

  { title: "Log4Shell / CVE-2021-44228", year: 2021, theme: "supply-chain", sector: "Cross-sector",
    summary: "A critical RCE vulnerability in Apache Log4j affected virtually every Java application worldwide.",
    techniques: ["T1190", "T1059"], ttps: ["JNDI injection", "Remote code execution via log message"],
    timeline: "Disclosed Dec 9, 2021. Mass exploitation within 24 hours. Patching took months globally.",
    impact: "Hundreds of millions of devices vulnerable. Exploitation by nation-states within days.",
    lessonsLearned: "SBOM (Software Bill of Materials) is essential — you can't patch what you can't find." },

  { title: "Okta / LAPSUS$ via Sitel", year: 2022, theme: "supply-chain", sector: "Technology",
    summary: "LAPSUS$ accessed Okta's support systems via a third-party contractor (Sitel), affecting 366 customers.",
    techniques: ["T1199", "T1078"], impact: "366 Okta customers potentially affected. Massive trust erosion.",
    lessonsLearned: "Third-party contractor access must be time-limited and monitored." },

  { title: "PyPI / Malicious Packages", year: 2023, theme: "supply-chain", sector: "Technology",
    summary: "Hundreds of malicious packages uploaded to PyPI using typosquatting to steal developer credentials.",
    techniques: ["T1195.001"], impact: "Developer machines compromised. CI/CD secrets stolen.",
    lessonsLearned: "Package managers are a growing attack surface. Pin dependencies and verify hashes." },

  { title: "Barracuda ESG / UNC4841", year: 2023, theme: "supply-chain", sector: "Cross-sector",
    summary: "Chinese espionage group exploited Barracuda ESG zero-day for months. Fix: replace the hardware entirely.",
    techniques: ["T1190", "T1505.003"], ttps: ["Zero-day exploitation", "Web shell persistence", "Firmware-level backdoor"],
    impact: "Affected devices could not be patched — full hardware replacement required.",
    lessonsLearned: "Some compromises require hardware replacement, not just software patching." },

  // ═══ APT / NATION STATE (8) ═══
  { title: "Microsoft / Storm-0558", year: 2023, theme: "apt", sector: "Government",
    summary: "Chinese actors forged Azure AD tokens with a stolen MSA signing key, accessing government email.",
    techniques: ["T1199", "T1078.004"], ttps: ["Token forgery", "Stolen signing key", "Cross-tenant access"],
    impact: "US State Department and Commerce Department emails accessed. 25 organisations compromised.",
    lessonsLearned: "A single stolen signing key can compromise an entire identity platform." },

  { title: "FireEye / APT29", year: 2020, theme: "apt", sector: "Cybersecurity",
    summary: "Russia's APT29 breached FireEye itself, stealing red team tools before SolarWinds was discovered.",
    techniques: ["T1195.002", "T1078"], impact: "FireEye's red team toolset stolen. Led to discovery of SolarWinds campaign.",
    lessonsLearned: "Even cybersecurity companies get breached. Transparency in disclosure builds trust." },

  { title: "Microsoft / Midnight Blizzard", year: 2024, theme: "apt", sector: "Technology",
    summary: "Russian APT used password spraying on a legacy test account to access Microsoft executive emails.",
    techniques: ["T1110.003", "T1078"], ttps: ["Password spraying", "OAuth app abuse", "Legacy account exploitation"],
    timeline: "Initial access Nov 2023. Discovered Jan 2024. Exfiltrated source code and exec emails.",
    impact: "Microsoft executive emails accessed. Source code repositories compromised.",
    lessonsLearned: "Legacy and test accounts are forgotten attack surfaces. Clean up or disable them." },

  { title: "Volt Typhoon / US Infrastructure", year: 2024, theme: "apt", sector: "Critical Infrastructure",
    summary: "Chinese APT pre-positioned in US critical infrastructure — water, energy, telecom — for potential disruption.",
    techniques: ["T1078", "T1059", "T1003"], ttps: ["Living off the land", "SOHO router compromise", "Long-term persistence"],
    impact: "Pre-positioned across water, energy, and telecom infrastructure. Potential wartime disruption capability.",
    lessonsLearned: "Nation-state actors play the long game. Detection of LOTL techniques requires behavioural analysis." },

  { title: "Salt Typhoon / US Telecoms", year: 2024, theme: "apt", sector: "Telecommunications",
    summary: "Chinese APT accessed lawful intercept systems at AT&T, Verizon, and T-Mobile.",
    techniques: ["T1078", "T1557"], impact: "Wiretap request data and call metadata of senior US officials accessed.",
    lessonsLearned: "Lawful intercept infrastructure is a high-value espionage target." },

  { title: "Ivanti VPN / Multiple APTs", year: 2024, theme: "apt", sector: "Cross-sector",
    summary: "Multiple threat actors exploited Ivanti Connect Secure VPN zero-days for mass initial access.",
    techniques: ["T1190", "T1505.003"], ttps: ["Zero-day chaining", "Web shell deployment", "Authentication bypass"],
    impact: "CISA issued emergency directive. Thousands of VPN appliances compromised globally.",
    lessonsLearned: "VPN appliances are prime targets. Assume compromise and verify." },

  { title: "Iranian APT / Albanian Government", year: 2022, theme: "apt", sector: "Government",
    summary: "Iranian actors wiped Albanian government systems and leaked citizen data in political retaliation.",
    techniques: ["T1485", "T1486", "T1567"], impact: "Government services disrupted. Albania severed diplomatic ties with Iran.",
    lessonsLearned: "Cyberattacks are now tools of geopolitical conflict between nations." },

  { title: "Sandworm / Viasat", year: 2022, theme: "apt", sector: "Telecommunications",
    summary: "Russia's Sandworm wiped Viasat satellite modems one hour before the Ukraine invasion.",
    techniques: ["T1485", "T1195.002"], impact: "Satellite internet disrupted across Europe. Wind farm operations in Germany affected.",
    lessonsLearned: "Cyber is now the first strike in conventional warfare." },

  // ═══ INSIDER THREAT (5) ═══
  { title: "Tesla / Employee Data Theft", year: 2023, theme: "insider-threat", sector: "Manufacturing",
    summary: "Two former employees leaked 75,000+ worker records to a German newspaper.",
    techniques: ["T1567", "T1048"], impact: "75,000+ employee SSNs, salaries, and production secrets exposed.",
    lessonsLearned: "DLP and access revocation at offboarding are essential." },

  { title: "Capital One / Cloud Insider", year: 2019, theme: "insider-threat", sector: "Financial Services",
    summary: "A former AWS employee exploited a misconfigured WAF to access Capital One's S3 buckets.",
    techniques: ["T1078", "T1530"], impact: "100M+ customer records exposed. $80M fine from OCC.",
    lessonsLearned: "Cloud misconfigurations are discoverable. CSPM tools catch what humans miss." },

  { title: "Twitter / Insider Access Abuse", year: 2022, theme: "insider-threat", sector: "Technology",
    summary: "A former Twitter employee was convicted of spying for Saudi Arabia, accessing dissident accounts.",
    techniques: ["T1078", "T1530"], impact: "Saudi dissidents' private data accessed. Employee convicted of espionage.",
    lessonsLearned: "Insider threats include nation-state recruitment of employees." },

  { title: "Cash App / Former Employee", year: 2022, theme: "insider-threat", sector: "Financial Services",
    summary: "A former employee downloaded reports containing 8M+ customer records after leaving the company.",
    techniques: ["T1530", "T1048"], impact: "8.2M customer investment records stolen.",
    lessonsLearned: "Access must be revoked immediately at termination. Monitor post-departure access." },

  { title: "Yahoo / Trade Secret Theft", year: 2022, theme: "insider-threat", sector: "Technology",
    summary: "A Yahoo research scientist stole 570,000 pages of trade secrets before joining a competitor.",
    techniques: ["T1048", "T1567"], impact: "570,000 pages of proprietary AI/AdTech research stolen.",
    lessonsLearned: "Monitor bulk data downloads, especially during notice periods." },

  // ═══ CLOUD BREACH (5) ═══
  { title: "Okta / Support System Breach", year: 2023, theme: "cloud-breach", sector: "Technology",
    summary: "Attackers accessed Okta's support case management system, stealing customer session tokens from HAR files.",
    techniques: ["T1078", "T1528"], impact: "All Okta support customers affected. BeyondTrust and Cloudflare targeted downstream.",
    lessonsLearned: "HAR files contain session tokens. Never upload them to support portals." },

  { title: "Snowflake Customer Breaches", year: 2024, theme: "cloud-breach", sector: "Cross-sector",
    summary: "Stolen credentials (no MFA) used to access 165+ Snowflake customer instances.",
    techniques: ["T1078", "T1530"], ttps: ["Credential stuffing", "No MFA enforcement", "Mass data exfiltration"],
    impact: "AT&T (110M records), Ticketmaster (560M), Santander, LendingTree all breached.",
    lessonsLearned: "MFA on SaaS platforms is not optional. Shared responsibility means enforcing it." },

  { title: "LastPass / Cloud Backup Theft", year: 2022, theme: "cloud-breach", sector: "Technology",
    summary: "Attackers stole encrypted password vaults from LastPass's cloud backup environment.",
    techniques: ["T1078", "T1530"], ttps: ["Developer home computer compromised", "Cloud storage key theft", "Vault exfiltration"],
    timeline: "First breach Aug 2022. Second breach Nov 2022 using data from first. Disclosed Dec 2022.",
    impact: "25M+ users' encrypted vaults stolen. Weak master passwords crackable offline.",
    lessonsLearned: "Defence in depth — encrypted data is only safe if the encryption is strong enough." },

  { title: "CircleCI / Engineer Token Theft", year: 2023, theme: "cloud-breach", sector: "Technology",
    summary: "An engineer's laptop was compromised via malware, stealing SSO and customer secrets from CircleCI.",
    techniques: ["T1078", "T1552"], impact: "All customer secrets and tokens potentially exposed. Mass rotation required.",
    lessonsLearned: "Developer machines are high-value targets. EDR on engineering endpoints is essential." },

  { title: "Roblox / Insider Phishing", year: 2023, theme: "cloud-breach", sector: "Gaming",
    summary: "Internal documents stolen via social engineering of a Roblox employee, exposing creator payment data.",
    techniques: ["T1566", "T1530"], impact: "Creator identity documents and payment info exposed.",
    lessonsLearned: "Internal tools with PII access need stronger authentication than standard corporate apps." },

  // ═══ DATA EXFILTRATION (5) ═══
  { title: "T-Mobile / Repeated Breaches", year: 2023, theme: "data-exfil", sector: "Telecommunications",
    summary: "T-Mobile's 8th breach in 5 years exposed 37M customer records via an insecure API.",
    techniques: ["T1190", "T1530"], impact: "37M customer records stolen. Repeated breaches eroded all trust.",
    lessonsLearned: "API security and rate limiting prevent bulk data extraction." },

  { title: "23andMe / Credential Stuffing", year: 2023, theme: "data-exfil", sector: "Healthcare",
    summary: "Credential stuffing accessed 14,000 accounts, then DNA Relatives feature exposed 6.9M users' data.",
    techniques: ["T1110.004", "T1530"], impact: "6.9M users' ancestry and genetic data exposed. Company filed for bankruptcy.",
    lessonsLearned: "Social features amplify breach impact — one compromised account exposes many." },

  { title: "Medibank / REvil", year: 2022, theme: "data-exfil", sector: "Healthcare",
    summary: "Attackers stole 9.7M customer health records and published them after Medibank refused to pay.",
    techniques: ["T1078", "T1567"], impact: "9.7M records including mental health and abortion data published.",
    lessonsLearned: "Health data is the most sensitive PII. The impact of leaks is life-altering." },

  { title: "Optus / API Exploitation", year: 2022, theme: "data-exfil", sector: "Telecommunications",
    summary: "An unauthenticated API endpoint exposed 11.2M Australian customer records to sequential scraping.",
    techniques: ["T1190", "T1530"], impact: "11.2M records including passport numbers. CEO resigned.",
    lessonsLearned: "API authentication is not optional. Test for IDOR and sequential access vulnerabilities." },

  { title: "MOVEit / Cl0p Mass Exploitation", year: 2023, theme: "data-exfil", sector: "Cross-sector",
    summary: "Cl0p exploited MOVEit Transfer zero-day for mass data theft from 2,500+ organisations.",
    techniques: ["T1190", "T1567"], impact: "62M+ individuals affected. Shell, BBC, US DoE, British Airways.",
    lessonsLearned: "File transfer tools are critical infrastructure. Zero-day preparedness matters." },

  // ═══ DDoS (3) ═══
  { title: "AWS / 2.3 Tbps DDoS", year: 2020, theme: "ddos", sector: "Cloud",
    summary: "Amazon mitigated a 2.3 Tbps DDoS attack using CLDAP reflection — the largest ever at the time.",
    techniques: ["T1498.002"], impact: "Mitigated successfully. Demonstrated scale of modern DDoS capabilities.",
    lessonsLearned: "Only cloud-scale DDoS protection can handle modern volumetric attacks." },

  { title: "Dyn DNS / Mirai Botnet", year: 2016, theme: "ddos", sector: "Technology",
    summary: "Mirai botnet hijacked IoT devices to attack Dyn DNS, taking down Twitter, Netflix, Reddit, and GitHub.",
    techniques: ["T1498", "T1584.005"], impact: "Major internet services offline for hours. IoT security became a national concern.",
    lessonsLearned: "IoT devices with default credentials are DDoS weapons at scale." },

  { title: "Google / 46M RPS DDoS", year: 2022, theme: "ddos", sector: "Technology",
    summary: "Google Cloud Armor blocked 46 million requests per second — 76% larger than any previous attack.",
    techniques: ["T1498"], impact: "Blocked successfully. Demonstrated exponential growth in DDoS capability.",
    lessonsLearned: "Application-layer DDoS is growing faster than volumetric attacks." },
];

// ═══ HELPER FUNCTIONS ═══

export function getIncidentsForTheme(theme: string, count: number = 3): RealIncident[] {
  const matches = REAL_INCIDENTS.filter(i => i.theme === theme);
  return matches.sort(() => Math.random() - 0.5).slice(0, count);
}

export function getRandomIncident(theme: string): RealIncident | null {
  const matches = REAL_INCIDENTS.filter(i => i.theme === theme);
  return matches.length > 0 ? matches[Math.floor(Math.random() * matches.length)] : null;
}

export function getIncidentsByTechnique(technique: string): RealIncident[] {
  return REAL_INCIDENTS.filter(i => i.techniques?.includes(technique));
}

export function getIncidentsBySector(sector: string): RealIncident[] {
  return REAL_INCIDENTS.filter(i => i.sector?.toLowerCase().includes(sector.toLowerCase()));
}

// Build a rich context string for the AI prompt
export function buildIncidentContext(theme: string, sector?: string): string {
  const themeIncidents = getIncidentsForTheme(theme, 5);
  const sectorIncidents = sector ? getIncidentsBySector(sector).slice(0, 3) : [];
  const all = [...new Map([...themeIncidents, ...sectorIncidents].map(i => [i.title, i])).values()];

  return all.map(i => {
    let ctx = `• ${i.title} (${i.year}): ${i.summary}`;
    if (i.ttps) ctx += `\n  TTPs: ${i.ttps.join(", ")}`;
    if (i.timeline) ctx += `\n  Timeline: ${i.timeline}`;
    if (i.impact) ctx += `\n  Impact: ${i.impact}`;
    if (i.lessonsLearned) ctx += `\n  Key Lesson: ${i.lessonsLearned}`;
    return ctx;
  }).join("\n\n");
}
