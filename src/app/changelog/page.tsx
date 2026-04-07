import Link from "next/link";

const highlights = [
  { ver: "1.0", title: "Launch Ready", desc: "Head-to-head duels with email notifications, adaptive difficulty targeting weak spots, 22 real-world incident references, weekly challenge emails, nav reorganisation, SEO, error boundaries" },
    { ver: "0.9", title: "Engagement Engine", desc: "Daily drills, weekly challenges, XP/streaks, campaigns, team compliance, Teams bot, email notifications" },
  { ver: "0.8", title: "Pre-Launch", desc: "Password reset, plan enforcement, terms, privacy, onboarding, feature flags, scheduled reports" },
  { ver: "0.7", title: "Security Audit", desc: "7 findings fixed: rate limiting, auth hardening, info leak prevention, tenant isolation" },
  { ver: "0.6", title: "Admin Expansion", desc: "Broadcasts, threat intel, review queue, activity feed, audit log, feature flags" },
  { ver: "0.5", title: "Analytics", desc: "MITRE heatmap, compliance evidence (6 frameworks), benchmarks, leaderboard, sharing" },
  { ver: "0.4", title: "Playbooks", desc: "AI playbook generation, PDF/Word export, certificates, custom branding, AI learning" },
  { ver: "0.3", title: "Multiplayer", desc: "Real-time team exercises, 8 SIEM connectors, Slack bot, email verification" },
  { ver: "0.2", title: "Core Engine", desc: "AI exercises, 21 themes, characters, cloning, star ratings" },
  { ver: "0.1", title: "Foundation", desc: "Auth, multi-tenant, RBAC, i18n, MFA, Prisma, Vercel" },
];

export default function PublicChangelogPage() {
  return (
    <div className="min-h-screen px-4 py-12 max-w-3xl mx-auto">
      <Link href="/" className="text-gray-500 text-sm hover:text-white mb-8 inline-block">← Back to ThreatCast</Link>
      <h1 className="font-display text-3xl font-bold text-white mb-2">Changelog</h1>
      <p className="text-gray-500 text-sm mb-8">What&apos;s new in ThreatCast</p>
      <div className="space-y-4">{highlights.map(h => (
        <div key={h.ver} className="cyber-card">
          <div className="flex items-center gap-2 mb-1"><span className="font-mono text-cyber-400 text-sm font-bold">v{h.ver}</span><h2 className="text-white text-sm font-semibold">{h.title}</h2></div>
          <p className="text-gray-500 text-xs">{h.desc}</p>
        </div>
      ))}</div>
    </div>
  );
}
