export default function GuidePage() {
  const sections = [
    { title: "Getting Started", icon: "🚀", items: [
      { q: "How do I run my first exercise?", a: "Go to Exercises → New Exercise. Choose a threat theme, set difficulty, optionally select MITRE techniques and characters, then click Generate & Launch. The AI builds a realistic scenario in 15-30 seconds." },
      { q: "How do I set up my company profile?", a: "Go to Organisation → Company Profile. Fill in your industry, company size, cloud provider, and security posture. This context makes AI-generated exercises specific to your environment." },
      { q: "How do I add my security tools?", a: "Go to Organisation → Security Stack. Select the tools your team uses (CrowdStrike, Defender, Splunk, etc). The AI will reference your actual tools in scenarios — making them feel real." },
    ]},
    { title: "Exercises", icon: "🎯", items: [
      { q: "What are the difficulty levels?", a: "Beginner (foundational concepts), Intermediate (hands-on response), Advanced (complex multi-vector), Expert (APT-level with ambiguous decisions). The AI adapts question complexity accordingly." },
      { q: "Can I create custom scenarios?", a: "Yes! Go to Exercises → Custom Scenario. Paste a real incident report, news article, or threat description and the AI converts it into a tabletop exercise tailored to your organisation." },
      { q: "How do templates work?", a: "Templates are pre-configured exercises you can launch with one click. They set the theme, difficulty, and question count for common scenarios like ransomware, phishing, or insider threats." },
      { q: "Can I navigate away while generating?", a: "Yes. The scenario generates in the background. You will receive an email when it is ready with a direct link to launch it." },
    ]},
    { title: "Characters", icon: "🎭", items: [
      { q: "What are characters?", a: "Characters are named individuals (CISO, SOC Analyst, CTO, etc.) that appear in your exercises. The AI weaves them into the narrative — sending Slack messages, making decisions, arguing in incident calls." },
      { q: "How do descriptions affect behaviour?", a: "Character descriptions directly shape how they act. If you describe someone as 'cautious and methodical', the AI has them advocate careful analysis. If 'aggressive and decisive', they push for immediate action." },
      { q: "Are characters shared across the team?", a: "Yes. Characters belong to the portal, not individual users. Anyone in your organisation can select and use them in exercises." },
    ]},
    { title: "Performance & Compliance", icon: "📊", items: [
      { q: "How is accuracy calculated?", a: "Accuracy = correct answers ÷ total questions × 100. Each exercise tracks individual and team accuracy. The platform calculates trends over time." },
      { q: "How does compliance evidence work?", a: "Every completed exercise generates evidence mapped to frameworks (ISO 27001, NIST CSF, SOC 2, NIS2, DORA). Export this as CSV for your compliance team or auditors." },
      { q: "What are achievements?", a: "Badges earned by completing exercises, reaching accuracy milestones, covering MITRE techniques, and participating in team exercises. They gamify security training." },
    ]},
    { title: "Team Management", icon: "👥", items: [
      { q: "How do I invite team members?", a: "Go to Organisation → Team and enter email addresses. They will receive an invitation email with a pre-filled sign-up link. The first person to join becomes Portal Admin." },
      { q: "What are the roles?", a: "Portal Admin: invite users, manage settings, view all data, configure integrations. Participant: run exercises, view own performance, leaderboard, and achievements." },
      { q: "Can I change someone's role?", a: "Portal Admins can promote/demote team members using the 3-dot menu on the Team page. You cannot demote yourself if you are the only admin." },
    ]},
    { title: "Integrations", icon: "🔌", items: [
      { q: "How do I connect Microsoft Teams?", a: "Go to Configure → Integrations → Microsoft Teams. Create an Incoming Webhook in your Teams channel settings, paste the URL, and click Save. Exercise results will be posted automatically." },
      { q: "What SIEM integrations are supported?", a: "Splunk (via HEC), Microsoft Sentinel (Log Analytics), and generic webhook. Exercise events are sent as structured JSON compatible with CIM." },
    ]},
    { title: "Account & Security", icon: "🔒", items: [
      { q: "How do I enable MFA?", a: "Go to Configure → Settings → Two-Factor Authentication. Click Set Up MFA, scan the QR code with your authenticator app (Google Authenticator, Authy, 1Password), and enter the 6-digit code." },
      { q: "How do I change my password?", a: "Go to Configure → Settings → Change Password. Enter your current password and set a new one (minimum 8 characters)." },
      { q: "How do I export my data?", a: "Go to Configure → Export Data. Download exercises, team performance, or compliance evidence as CSV files. Full GDPR data portability export is also available." },
    ]},
  ];

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">User Guide</h1><p className="text-gray-500 text-xs mt-1">Everything you need to know about ThreatCast</p></div>
      {sections.map(s => (
        <div key={s.title} className="mb-6">
          <h2 className="text-white text-base font-semibold mb-3 flex items-center gap-2"><span>{s.icon}</span>{s.title}</h2>
          <div className="space-y-2">{s.items.map((item, i) => (
            <details key={i} className="cyber-card group">
              <summary className="text-white text-sm font-medium cursor-pointer list-none flex items-center justify-between">
                {item.q}
                <span className="text-gray-500 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">{item.a}</p>
            </details>
          ))}</div>
        </div>
      ))}
    </div>
  );
}
