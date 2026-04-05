export default function ChangelogPage() {
  const entries = [
    { date: "April 2026", version: "1.0", title: "ThreatCast Launch", items: [
      "AI-powered tabletop exercise generation with Claude",
      "21 threat themes including 9 real-world incident reconstructions",
      "12-language support (EN, ES, FR, DE, PT, IT, NL, JA, ZH, KO, AR, HI)",
      "MITRE ATT&CK coverage tracking and gap analysis",
      "Compliance evidence mapping (ISO 27001, NIST CSF, SOC 2, NIS2, DORA)",
      "Board-ready executive reports and PDF certificates",
      "Custom scenario builder — paste incident reports, AI converts to exercises",
      "Team performance benchmarks with industry comparison",
      "12 achievement badges and leaderboards",
      "Exercise replay with answer explanations",
      "MFA (TOTP) and SAML SSO configuration",
      "Webhook/SIEM integrations (Splunk, Sentinel, ServiceNow)",
      "Custom branding for Enterprise clients",
      "Email domain matching for automatic portal assignment",
      "Threat intelligence scanner with daily auto-scan",
      "Full admin portal with 16 management pages",
      "Data export (CSV) for clients and administrators",
    ]},
  ];
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-white mb-2">Changelog</h1>
      <p className="text-gray-500 text-sm mb-8">What&apos;s new in ThreatCast</p>
      {entries.map(e => (
        <div key={e.version} className="cyber-card mb-6">
          <div className="flex items-center gap-3 mb-4"><span className="cyber-badge bg-cyber-600/20 text-cyber-400 text-xs">v{e.version}</span><span className="text-gray-500 text-xs">{e.date}</span></div>
          <h2 className="font-display text-lg font-bold text-white mb-3">{e.title}</h2>
          <ul className="space-y-1.5">{e.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-400"><span className="text-cyber-500 mt-1">•</span>{item}</li>
          ))}</ul>
        </div>
      ))}
    </div>
  );
}
