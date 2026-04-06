export default function GuidePage() {
  const sections = [
    { title: "Getting Started", icon: "🚀", items: [
      { q: "How do I run my first exercise?", a: "Go to Exercises → New Exercise. Choose a theme, set difficulty, optionally select MITRE techniques and characters, then click Generate & Launch. The AI builds a realistic scenario in 15-30 seconds." },
      { q: "How do I set up my company profile?", a: "Go to Organisation → Company Profile. Fill in your industry, company size, cloud provider, and security posture. This makes AI exercises specific to your environment." },
      { q: "How do I add my security tools?", a: "Go to Organisation → Security Stack. Select tools your team uses (CrowdStrike, Defender, Splunk, etc). The AI will reference your actual tools in scenarios. Missing a tool? Use the Suggest button at the bottom." },
    ]},
    { title: "Live Alert Feed", icon: "🚨", items: [
      { q: "How do I connect my SIEM/XDR?", a: "Go to Configure → Integrations. Expand a connector (e.g. Taegis, CrowdStrike), enter your API credentials, and click Save & Connect. Alerts appear in the Live Alert Feed." },
      { q: "Which platforms are supported?", a: "Secureworks Taegis XDR, CrowdStrike Falcon, Microsoft Defender XDR, Microsoft Sentinel, Tenable.io, Splunk, Elastic Security, and Palo Alto Cortex XDR." },
      { q: "How do I build an exercise from a real alert?", a: "Go to Live Alert Feed, find an alert, and click Build TTX →. The AI generates an exercise based on that actual alert in your environment. Critical alerts appear at the top." },
    ]},
    { title: "Exercises", icon: "🎯", items: [
      { q: "What are the difficulty levels?", a: "Beginner (foundational), Intermediate (hands-on response), Advanced (complex multi-vector), Expert (APT-level with ambiguous decisions). The AI adapts based on your past performance." },
      { q: "How do templates work?", a: "Templates are one-click launch exercises. Click a template → AI generates immediately → you land on the exercise. No wizard steps needed." },
      { q: "Can I navigate away during generation?", a: "Yes. You will receive an email when the scenario is ready with a direct link. The exercise page auto-polls and starts when generation completes." },
      { q: "Can team members attempt my exercises?", a: "Yes. Any completed exercise has an Attempt → button. Team members get their own fresh session with the same scenario, tracked separately." },
      { q: "How do I share an exercise externally?", a: "Share links can be generated from the exercise page. The shared page shows the exercise title, scores, and a CTA to sign up." },
    ]},
    { title: "Characters", icon: "🎭", items: [
      { q: "How do descriptions shape behaviour?", a: "If you describe someone as 'cautious and methodical', the AI has them advocate careful analysis. If 'aggressive and decisive', they push for immediate action. Characters with specific expertise demonstrate it in their dialogue." },
      { q: "Are characters shared?", a: "Yes. Characters belong to the portal. Anyone in your organisation can select and use them. Custom roles and departments are remembered for next time." },
    ]},
    { title: "Performance & Compliance", icon: "📊", items: [
      { q: "How does My Performance work?", a: "Shows month-by-month accuracy trends, improvement/regression indicators, and suggests themes where you need more practice (below 70% accuracy)." },
      { q: "What are benchmarks?", a: "Benchmarks compare your portal's accuracy and exercise volume against anonymised platform averages, so you know how you stack up." },
      { q: "How does compliance evidence work?", a: "ThreatCast maps your exercises to 6 frameworks: ISO 27001, NIST CSF, SOC 2, NIS2, DORA, PCI DSS 4.0. Each framework shows which controls are evidenced and what's still needed." },
      { q: "What is MITRE coverage?", a: "A visual heatmap showing which MITRE ATT&CK techniques your exercises have covered. Grey = uncovered, yellow = low, cyan = medium, green = high coverage." },
    ]},
    { title: "Playbooks & Certificates", icon: "📋", items: [
      { q: "How do playbooks work?", a: "Every exercise generates an incident response playbook. View it from the completion screen, and it auto-saves to your Playbook Library. Export as PDF or Word." },
      { q: "How do certificates work?", a: "Download a certificate PDF from any completed exercise. Certificates are auto-stored on your profile with a 1-year expiry. View all certificates under My Certificates." },
      { q: "Do certificates expire?", a: "Yes, after 1 year. Expired certificates appear dimmed with an EXPIRED badge. Complete the exercise again to earn a new one." },
    ]},
    { title: "Team & Multiplayer", icon: "👥", items: [
      { q: "How do I run a team exercise?", a: "When creating an exercise, select Group (Real-time) in the Configuration step. After generation, you land in a lobby. Share the link with your team. When everyone joins, click Start Exercise." },
      { q: "How do I invite team members?", a: "Go to Organisation → Team and enter email addresses. They receive an invitation email with a pre-filled sign-up link." },
      { q: "What roles are there?", a: "Portal Admin (invite users, manage settings, view all data) and Participant (run exercises, view own performance). The first person to join becomes Portal Admin." },
    ]},
    { title: "Integrations", icon: "🔌", items: [
      { q: "How do I connect Microsoft Teams?", a: "Go to Integrations → Microsoft Teams. Create an Incoming Webhook in your Teams channel, paste the URL, and click Save." },
      { q: "How do I set up the Slack bot?", a: "Create a Slack app, add a slash command pointing to https://threatcast.io/api/integrations/slack. Commands: /threatcast run [theme], /threatcast status, /threatcast leaderboard." },
      { q: "Can I suggest a missing integration?", a: "Yes! There is a Suggest button at the bottom of both the Integrations page and the Security Stack page." },
    ]},
    { title: "Account & Security", icon: "🔒", items: [
      { q: "How do I enable MFA?", a: "Go to Settings → Two-Factor Authentication. Scan the QR code with your authenticator app and enter the 6-digit code to enable." },
      { q: "How do I customise portal branding?", a: "Go to Configure → Branding. Set your portal name, logo URL, and primary colour. Changes appear in the sidebar. 'Powered by ThreatCast' shows in the footer." },
      { q: "How do I contact support?", a: "Click the support bubble (bottom-right). Send a message and check My Tickets to see admin replies. No email needed — everything is in-app." },
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
              <summary className="text-white text-sm font-medium cursor-pointer list-none flex items-center justify-between">{item.q}<span className="text-gray-500 group-open:rotate-180 transition-transform">▾</span></summary>
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">{item.a}</p>
            </details>
          ))}</div>
        </div>
      ))}
    </div>
  );
}
