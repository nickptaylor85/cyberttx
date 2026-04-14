// ═══════════════════════════════════════════════════════════════
// TOOL-SPECIFIC ALERT TEMPLATES
// Realistic alert titles and formats for each security platform
// The AI uses these to generate alerts that look like the real thing
// ═══════════════════════════════════════════════════════════════

export interface AlertTemplate {
  tool: string;
  vendor: string;
  alertTitles: { severity: string; title: string; context: string }[];
}

export const ALERT_TEMPLATES: Record<string, AlertTemplate> = {
  "Microsoft Sentinel": {
    tool: "Microsoft Sentinel", vendor: "Microsoft",
    alertTitles: [
      { severity: "high", title: "Suspicious sign-in from Tor exit node", context: "Analytics rule: ThreatIntelligenceIndicator | where NetworkIP in (SigninLogs | where ResultType == 0)" },
      { severity: "critical", title: "MFA denied followed by successful sign-in from new location", context: "KQL: SigninLogs | where MfaDetail.authMethod == 'PhoneAppNotification' and Status.errorCode == 500121 | join kind=inner (SigninLogs | where ResultType == 0)" },
      { severity: "high", title: "Anomalous token usage - token replayed from different IP", context: "UEBA: Rare country sign-in for user followed by impossible travel detection" },
      { severity: "medium", title: "Large volume of failed sign-ins indicating password spray", context: "Analytics: Multiple failed logins (>50) against different accounts from same IP range within 10 minutes" },
      { severity: "critical", title: "New inbox rule created to forward all mail externally", context: "OfficeActivity | where Operation == 'New-InboxRule' | where Parameters contains 'ForwardTo'" },
    ]
  },
  "Microsoft Defender for Endpoint": {
    tool: "Microsoft Defender for Endpoint", vendor: "Microsoft",
    alertTitles: [
      { severity: "critical", title: "Ransomware behavior detected on YOURHOST", context: "Alert: Process 'svchost.exe' spawned 'cmd.exe' which executed 'vssadmin delete shadows /all'" },
      { severity: "high", title: "Suspicious PowerShell command line", context: "PowerShell.exe -enc SQBFAFgAIAAoAE4AZQB3AC... (Base64 encoded IEX download cradle)" },
      { severity: "high", title: "Credential dumping tool detected (Mimikatz)", context: "Process: C:\\Users\\admin\\AppData\\Local\\Temp\\m.exe matched signature: HackTool:Win64/Mikatz!dha" },
      { severity: "medium", title: "Suspicious remote thread created in lsass.exe", context: "Process 'rundll32.exe' created remote thread in 'lsass.exe' — potential credential access" },
      { severity: "critical", title: "Cobalt Strike beacon communication detected", context: "Network: Periodic HTTPS beaconing to 185.XXX.XXX.XXX:443 every 60s ± jitter. Malleable C2 profile detected." },
    ]
  },
  "Microsoft Defender for Identity": {
    tool: "Microsoft Defender for Identity", vendor: "Microsoft",
    alertTitles: [
      { severity: "critical", title: "Suspected DCSync attack (replication of directory services)", context: "User 'svc-backup' made replication request (GetNCChanges) to DC01 — not a known replication partner" },
      { severity: "high", title: "Suspected Kerberoasting activity", context: "User 'j.smith' requested TGS tickets for 47 service accounts in 3 minutes — anomalous volume" },
      { severity: "high", title: "Suspected pass-the-hash attack", context: "NTLM authentication from 10.0.1.52 using hash for 'admin-DA' — source is not the user's known workstation" },
      { severity: "medium", title: "Reconnaissance via LDAP queries", context: "User 'temp-contractor' ran 312 LDAP queries against sensitive groups including Domain Admins, Enterprise Admins" },
    ]
  },
  "CrowdStrike Falcon": {
    tool: "CrowdStrike Falcon", vendor: "CrowdStrike",
    alertTitles: [
      { severity: "critical", title: "Process injection into lsass.exe detected", context: "Severity: Critical | Tactic: Credential Access | Technique: T1003.001 | Host: WS-FINANCE-04" },
      { severity: "critical", title: "Ransomware file encryption activity", context: "IOA: FileWriteRename pattern across 500+ files in 60 seconds. Extension: .locked. Process: svch0st.exe" },
      { severity: "high", title: "Cobalt Strike Beacon detected — Malleable C2", context: "IOC: Beacon watermark 391144938. Sleep: 60s. Named pipe: \\\\.\\.\\pipe\\msagent_89" },
      { severity: "high", title: "Suspicious lateral movement via WMI", context: "Process tree: cmd.exe → wmic.exe /node:SRV-DC01 process call create 'powershell -enc ...'" },
      { severity: "medium", title: "Unusual scheduled task created for persistence", context: "schtasks.exe /create /tn 'WindowsUpdate' /tr 'C:\\ProgramData\\update.exe' /sc onlogon" },
    ]
  },
  "Secureworks Taegis XDR": {
    tool: "Secureworks Taegis XDR", vendor: "Secureworks",
    alertTitles: [
      { severity: "critical", title: "SUPERNOVA: Post-exploitation tool execution", context: "CTU Alert: Known adversary tool detected. Confidence: High. Kill chain: Actions on Objectives" },
      { severity: "high", title: "Suspicious authentication from anomalous location", context: "Taegis XDR: User 'cfo@company.com' authenticated from IP 185.XXX.XXX.XXX (Russia) — first time country" },
      { severity: "high", title: "Living-off-the-land binary execution chain", context: "LOLBin chain: mshta.exe → powershell.exe → certutil.exe -urlcache -split -f http://..." },
      { severity: "medium", title: "DNS query to known C2 domain", context: "DNS: api-update[.]microsoftonline-auth[.]com resolved by WS-HR-12 — domain on CTU threat intel feed" },
    ]
  },
  "Splunk": {
    tool: "Splunk Enterprise Security", vendor: "Splunk",
    alertTitles: [
      { severity: "critical", title: "Notable Event: Excessive failed authentication", context: "index=authentication sourcetype=WinEventLog:Security EventCode=4625 | stats count by src_ip | where count>100" },
      { severity: "high", title: "Notable Event: New service installed on domain controller", context: "index=windows sourcetype=WinEventLog:System EventCode=7045 host=DC01 | where Service_Name!='known_services'" },
      { severity: "high", title: "Threat Intel match: outbound connection to known C2", context: "ES: Threat Intel Framework matched IP 91.XXX.XXX.XXX in firewall logs — tagged: APT29, Cobalt Strike" },
      { severity: "medium", title: "Data exfiltration: unusual outbound data volume", context: "index=network bytes_out>500000000 | stats sum(bytes_out) by src_ip dest_ip | where sum>1GB in 1hr" },
    ]
  },
  "Tenable.io": {
    tool: "Tenable.io", vendor: "Tenable",
    alertTitles: [
      { severity: "critical", title: "CVE-2024-XXXX: Remote Code Execution in [product]", context: "Plugin: 12345 | CVSS: 9.8 | Exploitable: Yes | Patch Available: Yes | Affected: 47 assets" },
      { severity: "critical", title: "Apache Log4j RCE (Log4Shell) — CVE-2021-44228", context: "Plugin: 156014 | CVSS: 10.0 | 23 assets vulnerable | Last scan: 2 hours ago" },
      { severity: "high", title: "SSL/TLS certificate expired on public-facing server", context: "Plugin: 15901 | Host: web-prod-01 | Expired: 14 days ago | Risk: MitM, browser warnings" },
      { severity: "medium", title: "SMBv1 enabled — known exploitation vector", context: "Plugin: 96982 | 12 Windows hosts still have SMBv1 enabled | Used by WannaCry, NotPetya" },
    ]
  },
  "Zscaler": {
    tool: "Zscaler Internet Access", vendor: "Zscaler",
    alertTitles: [
      { severity: "high", title: "SSL inspection bypass attempt detected", context: "User: j.finance@company.com attempted to access pinned-certificate site flagged as C2 infrastructure" },
      { severity: "high", title: "Cloud application policy violation — unsanctioned file sharing", context: "User uploaded 2.3GB to personal Dropbox account via browser. DLP policy: PII detected in 3 files" },
      { severity: "medium", title: "DNS tunnel detected — encoded data in DNS queries", context: "Unusual DNS query patterns from 10.0.1.52: high entropy subdomains to suspicious .xyz TLD" },
    ]
  },
};

// Build a tool-specific context string for the AI prompt
export function buildToolAlertContext(securityTools: { name: string; vendor: string; category: string }[]): string {
  const contexts: string[] = [];
  for (const tool of securityTools) {
    // Try exact match, then vendor match
    const template = ALERT_TEMPLATES[tool.name] ||
      Object.values(ALERT_TEMPLATES).find(t => t.vendor.toLowerCase() === tool.vendor.toLowerCase());
    if (template) {
      const examples = template.alertTitles.slice(0, 3).map(a =>
        `  [${a.severity.toUpperCase()}] ${a.title}\n  Context: ${a.context}`
      ).join("\n");
      contexts.push(`${template.tool}:\n${examples}`);
    }
  }
  return contexts.length > 0
    ? `\nREALISTIC ALERT EXAMPLES FROM THEIR ACTUAL TOOLS:\n${contexts.join("\n\n")}\n\nUse these EXACT alert title formats and context styles in your alerts. Make the exercise feel like their real console.`
    : "";
}
