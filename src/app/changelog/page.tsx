import Link from "next/link";

const highlights: { ver: string; date?: string; title: string; desc: string }[] = [
  { ver: "1.3", date: "Apr 2026", title: "Security & Accessibility Audit", desc: "BYOK key encryption (AES-256-GCM), rate limiting on AI endpoints, security headers on all middleware paths, WCAG accessibility: skip-to-content, landmarks, ARIA labels, reduced motion support, focus-visible outlines." },
  { ver: "1.2", date: "Apr 2026", title: "BYOK Multi-Provider AI", desc: "Bring Your Own Key for Pro & Enterprise. Support for Anthropic Claude, OpenAI GPT-4o (native JSON mode), and Google Gemini. API key validation, encrypted storage, model selection per provider." },
  { ver: "1.1", date: "Apr 2026", title: "Cyberpunk Rebrand", desc: "New angular shield logo with targeting reticle, neon cyan (#00ffd5) colour, monospace THREATCAST wordmark. Updated across landing, portal, admin, emails, certificates, and OG image." },
  { ver: "1.0", date: "Apr 2026", title: "Launch Ready", desc: "GDPR compliance (data export, account deletion, org deletion). Admin IP allowlist + access logging. Loading screen with rotating cyber tips during exercise generation. Broadcast email system. 5 cron jobs for engagement." },
  { ver: "0.9", date: "Apr 2026", title: "Engagement Engine", desc: "Head-to-head duels with email notifications, adaptive difficulty targeting weak spots, 22 real-world incident references, weekly challenge emails, daily drills, XP/streaks, campaigns." },
  { ver: "0.8", date: "Apr 2026", title: "Pre-Launch", desc: "Password reset, plan enforcement (Starter/Growth/Pro/Enterprise), terms, privacy, onboarding wizard, feature flags, scheduled reports." },
  { ver: "0.7", date: "Mar 2026", title: "Security Hardening", desc: "Two full pentests passed. Rate limiting, auth hardening, info leak prevention, tenant isolation, input validation." },
  { ver: "0.6", date: "Mar 2026", title: "Admin Expansion", desc: "Broadcasts, threat intel feed, review queue, activity feed, audit log, feature flags, email log with KPIs." },
  { ver: "0.5", date: "Mar 2026", title: "Analytics", desc: "MITRE ATT&CK heatmap, compliance evidence (ISO 27001, NIST CSF, SOC 2, NIS2, DORA, PCI DSS), benchmarks, leaderboard." },
  { ver: "0.4", date: "Mar 2026", title: "Playbooks", desc: "AI playbook generation, PDF/Word export, certificates with 1-year expiry, custom branding, AI adaptive learning." },
  { ver: "0.3", date: "Mar 2026", title: "Multiplayer", desc: "Real-time team exercises with Pusher, 8 SIEM/XDR connectors, Slack bot, email verification." },
  { ver: "0.2", date: "Mar 2026", title: "Core Engine", desc: "AI-generated exercises with Claude Sonnet, 21 themes, custom characters, exercise cloning, star ratings." },
  { ver: "0.1", date: "Mar 2026", title: "Foundation", desc: "NextAuth.js v5, multi-tenant RBAC, 12-language i18n, MFA/TOTP, Prisma + Neon PostgreSQL, Vercel deployment." },
];

export default function PublicChangelogPage() {
  return (
    <div className="min-h-screen px-4 py-12 max-w-3xl mx-auto">
      <Link href="/" className="text-gray-500 text-sm hover:text-white mb-8 inline-block">← Back to ThreatCast</Link>
      <h1 className="font-display text-3xl font-bold text-white mb-2">Changelog</h1>
      <p className="text-gray-500 text-sm mb-8">What&apos;s new in ThreatCast</p>
      <div className="space-y-4">{highlights.map(h => (
        <div key={h.ver} className="cyber-card">
          <div className="flex items-center gap-2 mb-1"><span className="font-mono text-cyber-400 text-sm font-bold">v{h.ver}</span><h2 className="text-white text-sm font-semibold">{h.title}</h2>{h.date && <span className="text-gray-600 text-xs">{h.date}</span>}</div>
          <p className="text-gray-500 text-xs">{h.desc}</p>
        </div>
      ))}</div>
    </div>
  );
}
