"use client";
import { useState, useCallback } from "react";

const QUESTIONS = [
  // ═══ MITRE ATT&CK & Frameworks ═══
  { q: "What does MITRE ATT&CK stand for?", a: ["Adversarial Tactics, Techniques & Common Knowledge", "Advanced Threat Testing & Cyber Knowledge", "Automated Threat Tracking & Classification Kit"], correct: 0 },
  { q: "Which framework uses Tactics, Techniques, and Procedures (TTPs)?", a: ["MITRE ATT&CK", "NIST CSF", "ISO 27001"], correct: 0 },
  { q: "How many tactics are in the MITRE ATT&CK Enterprise matrix?", a: ["14", "10", "20"], correct: 0 },
  { q: "Which MITRE ATT&CK tactic comes first in the kill chain?", a: ["Reconnaissance", "Initial Access", "Resource Development"], correct: 0 },
  { q: "What is the MITRE ATT&CK technique ID for Phishing?", a: ["T1566", "T1059", "T1078"], correct: 0 },
  { q: "Which compliance framework was created by NIST specifically for critical infrastructure?", a: ["NIST CSF", "ISO 27001", "SOC 2"], correct: 0 },
  { q: "What does NIS2 regulate in the EU?", a: ["Network and information security for essential services", "National intelligence sharing between NATO members", "Next-gen internet standards for 5G networks"], correct: 0 },
  { q: "What is DORA in the context of EU financial regulation?", a: ["Digital Operational Resilience Act", "Data Operations Regulatory Authority", "Digital Oversight and Risk Assessment"], correct: 0 },
  { q: "PCI DSS 4.0 applies to organisations that process what?", a: ["Payment card data", "Personal health information", "Government classified data"], correct: 0 },
  { q: "What does the CIA triad stand for in cybersecurity?", a: ["Confidentiality, Integrity, Availability", "Classification, Isolation, Authentication", "Control, Identity, Access"], correct: 0 },

  // ═══ Authentication & Identity ═══
  { q: "What is a 'Golden Ticket' attack?", a: ["Forging Kerberos TGTs with the KRBTGT hash", "Stealing session cookies from a browser", "Exploiting a zero-day in Active Directory"], correct: 0 },
  { q: "What is the default lifetime of a Kerberos TGT?", a: ["10 hours", "24 hours", "1 hour"], correct: 0 },
  { q: "What does MFA stand for?", a: ["Multi-Factor Authentication", "Managed Firewall Access", "Multiple File Authorisation"], correct: 0 },
  { q: "What is 'credential stuffing'?", a: ["Using stolen credentials across multiple sites", "Brute-forcing a single password", "Injecting SQL into login forms"], correct: 0 },
  { q: "What is a 'Pass-the-Hash' attack?", a: ["Using a stolen NTLM hash to authenticate without the plaintext password", "Cracking password hashes with rainbow tables", "Intercepting hashed packets in transit"], correct: 0 },
  { q: "What does SAML stand for?", a: ["Security Assertion Markup Language", "Secure Access Management Layer", "Standard Authentication Messaging Language"], correct: 0 },
  { q: "In OAuth 2.0, what is an 'access token'?", a: ["A credential used to access protected resources", "A physical hardware key for two-factor auth", "A digital certificate for TLS"], correct: 0 },
  { q: "What is 'Kerberoasting'?", a: ["Requesting service tickets to crack offline", "Exploiting Kerberos protocol vulnerabilities", "Flooding the KDC with fake ticket requests"], correct: 0 },
  { q: "What type of attack targets password reset mechanisms?", a: ["Account recovery attacks", "SQL injection", "Cross-site scripting"], correct: 0 },
  { q: "What is the principle of least privilege?", a: ["Users should only have the minimum access needed for their role", "Every user gets full admin access by default", "Privileges are assigned based on seniority"], correct: 0 },

  // ═══ Network Security ═══
  { q: "Which port does HTTPS use by default?", a: ["443", "80", "8080"], correct: 0 },
  { q: "What does a SIEM do?", a: ["Collects and analyses security event logs from multiple sources", "Scans networks for open ports", "Blocks malicious traffic at the firewall"], correct: 0 },
  { q: "What does EDR stand for?", a: ["Endpoint Detection and Response", "Enterprise Data Recovery", "External Defence Router"], correct: 0 },
  { q: "What is the purpose of a DMZ in network architecture?", a: ["A buffer zone between internal and external networks", "A backup data centre location", "A tool for DNS management"], correct: 0 },
  { q: "What does XDR extend beyond traditional EDR?", a: ["Cross-domain detection across endpoints, network, cloud, and email", "Extra data recovery capabilities", "Extended device registration"], correct: 0 },
  { q: "What port does SSH use by default?", a: ["22", "443", "3389"], correct: 0 },
  { q: "What is DNS poisoning?", a: ["Corrupting DNS cache to redirect traffic to malicious sites", "Overloading DNS servers with requests", "Encrypting DNS queries to hide traffic"], correct: 0 },
  { q: "What does a WAF protect against?", a: ["Web application attacks like SQL injection and XSS", "Wireless access point exploits", "Wide area network failures"], correct: 0 },
  { q: "What is ARP spoofing?", a: ["Sending fake ARP messages to link an attacker's MAC to a legitimate IP", "Encrypting ARP tables for security", "A method of network address translation"], correct: 0 },
  { q: "What protocol does TLS replace?", a: ["SSL", "SSH", "IPSec"], correct: 0 },

  // ═══ Malware & Techniques ═══
  { q: "What is a 'living off the land' attack?", a: ["Using legitimate system tools for malicious purposes", "Hiding malware in agricultural IoT devices", "Exploiting physical access to data centres"], correct: 0 },
  { q: "What is fileless malware?", a: ["Malware that operates entirely in memory without writing to disk", "A virus that deletes all files on a system", "Software that compresses files to avoid detection"], correct: 0 },
  { q: "What is a rootkit?", a: ["Software that hides its presence while maintaining privileged access", "A tool for managing root DNS servers", "A legitimate system administration tool"], correct: 0 },
  { q: "Which technique involves moving between systems in a network?", a: ["Lateral movement", "Privilege escalation", "Data exfiltration"], correct: 0 },
  { q: "What does 'C2' stand for in cybersecurity?", a: ["Command and Control", "Cyber 2.0", "Certificate Chain"], correct: 0 },
  { q: "What is a polymorphic virus?", a: ["A virus that changes its code each time it replicates", "A virus that only targets multiple operating systems", "A virus that spreads through polymorphic networks"], correct: 0 },
  { q: "What is a logic bomb?", a: ["Malicious code triggered by a specific condition or date", "A DDoS tool that overwhelms server logic", "A physical device used in penetration testing"], correct: 0 },
  { q: "What is process injection?", a: ["Running malicious code in the address space of a legitimate process", "Injecting new processes into a CPU pipeline", "Adding legitimate processes to a blocklist"], correct: 0 },
  { q: "What is DLL sideloading?", a: ["Placing a malicious DLL where a legitimate program will load it", "Updating system DLL files to the latest version", "A method of compressing DLL files for faster loading"], correct: 0 },
  { q: "What is a keylogger?", a: ["Software that records keystrokes to capture credentials", "A tool for managing encryption keys", "A hardware device for keyboard testing"], correct: 0 },

  // ═══ Real-World Breaches ═══
  { q: "What year was the SolarWinds Orion breach discovered?", a: ["2020", "2019", "2021"], correct: 0 },
  { q: "Which ransomware group attacked the NHS via Synnovis in 2024?", a: ["Qilin", "LockBit", "BlackCat"], correct: 0 },
  { q: "Which company was breached by Scattered Spider via a helpdesk call in 2023?", a: ["MGM Resorts", "Microsoft", "Apple"], correct: 0 },
  { q: "What file transfer tool was exploited by Cl0p in mass attacks in 2023?", a: ["MOVEit", "FileZilla", "WinSCP"], correct: 0 },
  { q: "Which supply chain attack compromised 3CX desktop client in 2023?", a: ["A trojanised build process via a compromised contractor", "A zero-day in the VoIP protocol", "A DNS hijacking attack"], correct: 0 },
  { q: "What was stolen in the Okta breach of 2023?", a: ["Customer support system session tokens", "Source code for the authentication platform", "Payment card data from enterprise clients"], correct: 0 },
  { q: "Which nation-state group breached Microsoft corporate email in 2024?", a: ["Midnight Blizzard (APT29)", "Lazarus Group", "Hafnium"], correct: 0 },
  { q: "The Colonial Pipeline attack in 2021 was caused by what?", a: ["A compromised VPN credential with no MFA", "A zero-day in pipeline SCADA systems", "An insider threat from a disgruntled employee"], correct: 0 },
  { q: "What did the Equifax breach of 2017 expose?", a: ["Personal data of 147 million people via unpatched Apache Struts", "Credit card numbers stored in plaintext", "Corporate email accounts via phishing"], correct: 0 },
  { q: "Which casino operator was hit by ransomware and paid $15M in 2023?", a: ["Caesars Entertainment", "Wynn Resorts", "MGM Resorts"], correct: 0 },

  // ═══ Social Engineering ═══
  { q: "What type of attack exploits the human element?", a: ["Social engineering", "Buffer overflow", "DNS poisoning"], correct: 0 },
  { q: "What is 'spear phishing'?", a: ["Targeted phishing aimed at a specific individual or organisation", "Mass email phishing campaigns", "Phishing via SMS messages"], correct: 0 },
  { q: "What is 'vishing'?", a: ["Voice phishing — social engineering over the phone", "Visual phishing using fake websites", "Video-based phishing attacks"], correct: 0 },
  { q: "What is 'pretexting'?", a: ["Creating a fabricated scenario to manipulate a victim", "Pre-testing a network before a penetration test", "Sending text messages before a phishing email"], correct: 0 },
  { q: "What is a 'watering hole' attack?", a: ["Compromising a website frequently visited by the target group", "Flooding a network with traffic from multiple sources", "Placing USB drives in a target's office"], correct: 0 },
  { q: "What is 'baiting' in social engineering?", a: ["Leaving malware-infected media for victims to find and use", "Using bait servers to detect attackers", "Trapping malware in a sandbox environment"], correct: 0 },
  { q: "What is business email compromise (BEC)?", a: ["Impersonating an executive to trick employees into transferring funds", "Breaking into a company's email server", "Sending spam from a business email account"], correct: 0 },
  { q: "According to the Verizon DBIR, what percentage of breaches involve a human element?", a: ["68%", "35%", "90%"], correct: 0 },
  { q: "What is 'smishing'?", a: ["Phishing via SMS text messages", "A type of encrypted messaging attack", "Smart device phishing via IoT"], correct: 0 },
  { q: "What is 'tailgating' in physical security?", a: ["Following an authorised person through a secure door", "Monitoring network traffic from behind a firewall", "Trailing a vehicle to discover a location"], correct: 0 },

  // ═══ Ransomware ═══
  { q: "What is 'double extortion' ransomware?", a: ["Encrypting data AND threatening to leak stolen files", "Attacking two systems simultaneously", "Demanding ransom in two different cryptocurrencies"], correct: 0 },
  { q: "Which ransomware group was taken down by law enforcement in Feb 2024?", a: ["LockBit", "REvil", "Conti"], correct: 0 },
  { q: "What is RaaS in cybercrime?", a: ["Ransomware as a Service", "Remote Access as a Service", "Recovery as a Service"], correct: 0 },
  { q: "What should you do FIRST when ransomware is detected?", a: ["Isolate affected systems from the network", "Pay the ransom immediately", "Restore from the most recent backup"], correct: 0 },
  { q: "What is the average ransomware payment in 2024?", a: ["Over $500,000", "Under $10,000", "Exactly $100,000"], correct: 0 },
  { q: "Which ransomware variant encrypted files AND wiped backups?", a: ["NotPetya", "WannaCry", "CryptoLocker"], correct: 0 },
  { q: "What vulnerability did WannaCry exploit in 2017?", a: ["EternalBlue (MS17-010) in SMBv1", "Heartbleed in OpenSSL", "Log4Shell in Apache Log4j"], correct: 0 },
  { q: "What is a ransomware 'affiliate'?", a: ["A partner who deploys ransomware using the RaaS operator's tools", "A company that pays ransoms on behalf of victims", "An insurance provider for cyber attacks"], correct: 0 },
  { q: "Which critical infrastructure sector is most targeted by ransomware?", a: ["Healthcare", "Agriculture", "Retail"], correct: 0 },
  { q: "What is the '3-2-1 backup rule'?", a: ["3 copies, 2 different media, 1 offsite", "3 daily backups, 2 weekly, 1 monthly", "3 servers, 2 locations, 1 cloud provider"], correct: 0 },

  // ═══ Cloud & Modern Threats ═══
  { q: "What is SSRF (Server-Side Request Forgery)?", a: ["Tricking a server into making requests to internal resources", "Encrypting server-side requests for security", "A server-side rendering framework"], correct: 0 },
  { q: "What is the shared responsibility model in cloud security?", a: ["Cloud provider secures infrastructure; customer secures their data and config", "The cloud provider handles all security", "Customers are responsible for all security in the cloud"], correct: 0 },
  { q: "What is a misconfigured S3 bucket?", a: ["An AWS storage container left publicly accessible", "A corrupted database backup", "An S3 bucket with too many files"], correct: 0 },
  { q: "What is container escape?", a: ["Breaking out of a container to access the host system", "Removing containers from a Kubernetes cluster", "Migrating containers between cloud providers"], correct: 0 },
  { q: "What does CSPM stand for?", a: ["Cloud Security Posture Management", "Cyber Security Protocol Manager", "Cloud Service Provider Monitoring"], correct: 0 },
  { q: "What is a supply chain attack?", a: ["Compromising a vendor's software to attack their customers", "Physically intercepting hardware deliveries", "Attacking the logistics industry specifically"], correct: 0 },
  { q: "What is 'shadow IT'?", a: ["Unapproved technology used without IT department knowledge", "Dark web infrastructure", "Backup systems that mirror production"], correct: 0 },
  { q: "What vulnerability was Log4Shell (CVE-2021-44228)?", a: ["Remote code execution in Apache Log4j via JNDI lookup", "SQL injection in Apache web server", "Buffer overflow in Java Runtime Environment"], correct: 0 },
  { q: "What is API key leakage?", a: ["Accidentally exposing API credentials in code repos or logs", "When API rate limits are exceeded", "Encrypting API keys with weak algorithms"], correct: 0 },
  { q: "What is a zero-day vulnerability?", a: ["A flaw unknown to the vendor with no patch available", "A vulnerability discovered on day one of deployment", "A bug that takes zero days to exploit"], correct: 0 },

  // ═══ Incident Response ═══
  { q: "What are the 6 phases of NIST incident response?", a: ["Preparation, Detection, Containment, Eradication, Recovery, Lessons Learned", "Plan, Detect, Respond, Recover, Report, Review", "Identify, Protect, Detect, Respond, Recover, Govern"], correct: 0 },
  { q: "What is the primary goal during the 'containment' phase?", a: ["Prevent the incident from spreading further", "Identify the root cause", "Restore normal operations"], correct: 0 },
  { q: "What is an IOC (Indicator of Compromise)?", a: ["Evidence that a security breach has occurred (hashes, IPs, domains)", "A tool for measuring incident response time", "A compliance requirement for reporting breaches"], correct: 0 },
  { q: "What is a tabletop exercise?", a: ["A discussion-based simulation of an incident scenario", "A physical security assessment of a data centre", "A network penetration test performed on-site"], correct: 0 },
  { q: "What is 'mean time to detect' (MTTD)?", a: ["Average time between a breach occurring and being discovered", "The mean time for malware to detonate", "Average detection rate of an EDR tool"], correct: 0 },
  { q: "What is chain of custody in digital forensics?", a: ["Documenting who handled evidence and when to maintain its integrity", "The sequence of events in a cyber attack", "A blockchain-based evidence storage system"], correct: 0 },
  { q: "What is a playbook in incident response?", a: ["A predefined set of procedures for responding to a specific incident type", "A training manual for new security analysts", "A document listing all known vulnerabilities"], correct: 0 },
  { q: "When should you involve legal counsel in an incident?", a: ["As early as possible, especially if PII or regulated data is involved", "Only after the incident is fully resolved", "Only if law enforcement requests it"], correct: 0 },
  { q: "What is the average time to identify a breach (IBM 2024)?", a: ["194 days", "30 days", "365 days"], correct: 0 },
  { q: "What is the average cost of a data breach in 2024 (IBM)?", a: ["$4.88 million", "$2.5 million", "$7.2 million"], correct: 0 },

  // ═══ Cryptography & Data Protection ═══
  { q: "What encryption algorithm is AES?", a: ["Advanced Encryption Standard — a symmetric block cipher", "Asymmetric Encryption System", "Automated Email Security"], correct: 0 },
  { q: "What is the difference between encryption and hashing?", a: ["Encryption is reversible; hashing is one-way", "Hashing is faster; encryption is more secure", "They are the same thing with different names"], correct: 0 },
  { q: "What does TLS ensure during data transmission?", a: ["Confidentiality and integrity of data in transit", "Permanent storage of encrypted data", "Authentication of physical devices"], correct: 0 },
  { q: "What is a digital certificate used for?", a: ["Verifying the identity of a server or entity using PKI", "Encrypting files on a local hard drive", "Generating one-time passwords for MFA"], correct: 0 },
  { q: "What is key rotation?", a: ["Periodically replacing cryptographic keys to limit exposure", "Physically rotating hardware security modules", "Changing key personnel in the security team"], correct: 0 },
  { q: "What is end-to-end encryption?", a: ["Only the sender and recipient can read the messages", "Encryption applied at every network hop", "Encrypting data at rest on both endpoints"], correct: 0 },
  { q: "What is a salt in password hashing?", a: ["Random data added to a password before hashing to prevent rainbow table attacks", "A secret key used to encrypt passwords", "The first character of a hashed password"], correct: 0 },
  { q: "What hashing algorithm is considered insecure today?", a: ["MD5", "SHA-256", "bcrypt"], correct: 0 },
  { q: "What is PKI?", a: ["Public Key Infrastructure — manages digital certificates and encryption keys", "Private Kernel Interface", "Portable Key Installer"], correct: 0 },
  { q: "What is homomorphic encryption?", a: ["Performing computations on encrypted data without decrypting it", "Using the same key for encryption and decryption", "Encrypting data that looks identical to the original"], correct: 0 },
];

function shuffleQuestion(q: typeof QUESTIONS[0]) {
  const indices = [0, 1, 2];
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return { q: q.q, a: indices.map(i => q.a[i]), correct: indices.indexOf(q.correct) };
}

export default function CyberTrivia({ onScore }: { onScore?: (correct: boolean) => void }) {
  const [questions] = useState(() => [...QUESTIONS].sort(() => Math.random() - 0.5).map(shuffleQuestion));
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const current = questions[qIdx % questions.length];

  const handleAnswer = useCallback((idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowResult(true);
    setTotal(t => t + 1);
    const isCorrect = idx === current.correct;
    if (isCorrect) setScore(s => s + 1);
    onScore?.(isCorrect);
    setTimeout(() => { setSelected(null); setShowResult(false); setQIdx(i => i + 1); }, 1500);
  }, [selected, current.correct, onScore]);

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[#00ffd5] text-xs font-mono font-bold">⚡ CYBER TRIVIA</span>
          <span className="text-gray-600 text-[10px]">while you wait</span>
        </div>
        <span className="text-[#00ffd5] font-mono text-xs">{score}/{total}</span>
      </div>
      <div className="bg-[#0a0a1a] border border-white/5 rounded-lg p-4 mb-3">
        <p className="text-white text-sm font-medium leading-relaxed">{current.q}</p>
      </div>
      <div className="space-y-2">
        {current.a.map((answer, i) => {
          let style = "border-white/5 bg-[#0f1729] hover:border-[#00ffd5]/30 hover:bg-[#00ffd5]/5 cursor-pointer";
          if (showResult && i === current.correct) style = "border-[#00ffd5]/50 bg-[#00ffd5]/10";
          else if (showResult && i === selected && i !== current.correct) style = "border-red-500/50 bg-red-500/10";
          else if (selected !== null) style = "border-white/5 bg-[#0f1729] opacity-50 cursor-default";
          return (
            <button key={i} onClick={() => handleAnswer(i)} disabled={selected !== null}
              className={"w-full text-left p-3 rounded-lg border transition-all text-sm " + style}>
              <span className="text-gray-500 font-mono text-xs mr-2">{String.fromCharCode(65 + i)}</span>
              <span className={showResult && i === current.correct ? "text-[#00ffd5]" : showResult && i === selected ? "text-red-400" : "text-gray-300"}>{answer}</span>
              {showResult && i === current.correct && <span className="float-right text-[#00ffd5]">✓</span>}
              {showResult && i === selected && i !== current.correct && <span className="float-right text-red-400">✗</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
