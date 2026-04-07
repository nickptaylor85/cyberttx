export const dynamic = "force-dynamic";

const CHANGELOG = [
  { version: "1.0.0", date: "7 Apr 2026", title: "Launch Ready — Duels, Adaptive AI, Real Incidents", type: "feature", items: [
    "⚔️ Head-to-Head Duels — challenge a teammate, 5 questions, 75-second timer, email notifications to all portal members",
    "🧠 Adaptive Difficulty — daily drills now target your weakest themes based on past performance analysis",
    "📰 'This Really Happened' cards — 22 real-world incidents (MGM, Colonial Pipeline, SolarWinds, MOVEit, etc.) referenced in question explanations",
    "📧 Duel email notifications — all teammates notified when someone throws down the gauntlet",
    "📧 Weekly challenge email — Monday 8am notification to all users with challenge theme and CTA",
    "🔒 Sign-up page now blocks when admin disables sign-ups (was only blocking at API level)",
    "📱 Portal nav reorganised — individual vs admin sections, best features at top",
    "🤖 robots.txt + sitemap.xml for SEO",
    "⚠️ Global error boundary for root layout crashes",
    "⏳ Loading spinners during page transitions",
    "🛡️ Auth secret fallback removed — requires AUTH_SECRET env var",
    "📖 User guide updated to 11 sections, 50+ Q&As",
    "📝 Admin changelog added (you're reading it!)",
    "🎯 Landing page rewritten with duels, adaptive AI, pricing, full feature showcase",
  ]},
  { version: "0.9.0", date: "6 Apr 2026", title: "Engagement Engine", type: "feature", items: [
    "⚡ Daily Quick-Fire Drills — 3 questions, 2-minute timer, AI-generated from 15 topics",
    "🏅 Weekly Challenge — rotating themes, platform-wide leaderboard, medal icons",
    "🔥 XP + Streak System — 10 levels (Recruit → Elite Defender), progress bar on every page",
    "📆 Training Campaigns — 12-month content calendar with themed exercises",
    "✅ Team Compliance Dashboard — traffic-light status (green/amber/red) per team member",
    "📧 Daily email digest with embedded question (weekdays 8:30am)",
    "🔔 Streak expiry notifications + dormant user re-engagement emails",
    "💬 Microsoft Teams bot — webhook integration with adaptive cards",
  ]},
  { version: "0.8.0", date: "6 Apr 2026", title: "Pre-Launch Essentials", type: "feature", items: [
    "🔑 Forgot password flow — email reset link with 1-hour expiry",
    "💳 Plan enforcement — exercise + user limits checked before generation/registration",
    "📜 Terms of Service — 11 sections, Scots law jurisdiction",
    "🔒 Privacy Policy — 10 sections, UK GDPR, SIEM data handling",
    "🚀 Onboarding wizard — 4-step setup (industry, size, security stack)",
    "🚩 Feature flags per client — 14 toggleable features with plan presets",
    "📅 Scheduled weekly reports — branded HTML digest every Monday 9am",
    "📊 Activity feed — real-time platform events across all portals",
  ]},
  { version: "0.7.0", date: "6 Apr 2026", title: "Security Audit", type: "security", items: [
    "🛡️ Removed hardcoded auth secret fallback",
    "🛡️ Registration no longer leaks userId (prevents enumeration)",
    "🛡️ Slack bot responses set to ephemeral (requester-only)",
    "🛡️ Threat intel API auth added (was unauthenticated)",
    "🛡️ Rate limiting: login (5/15min), registration (5/hr), reset (3/hr)",
    "🛡️ Shared exercises stripped of full scenario data",
    "🛡️ Tenant isolation on certificates + XP endpoints",
  ]},
  { version: "0.6.0", date: "6 Apr 2026", title: "Admin Portal Expansion", type: "feature", items: [
    "📢 Broadcast announcements — create banners shown to all portal users",
    "🔍 Threat Intelligence — 9 real-world scenarios (MOVEit, Okta, MGM, etc.)",
    "⚖️ Review Queue — user star ratings + low-score scenario flagging",
    "🔔 Activity Feed — real-time events across all portals",
    "📋 Audit Log — proper table with actions, actors, targets, timestamps",
    "🚩 Feature Flags — 14 toggleable features per client with plan presets",
    "🏢 View as link — quick access to client portals",
    "📊 Admin dashboard filters __platform__ org from counts",
  ]},
  { version: "0.5.0", date: "6 Apr 2026", title: "Analytics + Compliance", type: "feature", items: [
    "📊 MITRE ATT&CK Coverage Heatmap — visual technique coverage with hover tooltips",
    "📋 Compliance Evidence — ISO 27001, NIST CSF, SOC 2, NIS2, DORA, PCI DSS 4.0",
    "📈 Benchmarks — accuracy + volume vs platform average and company size",
    "👤 My Performance — monthly accuracy trends with improvement suggestions",
    "📈 Team Performance — aggregated monthly team trends",
    "🏆 Leaderboard — All Time + This Month with medal icons",
    "🔗 Exercise sharing — public share links with stripped-down viewer",
  ]},
  { version: "0.4.0", date: "6 Apr 2026", title: "Playbooks + Certificates", type: "feature", items: [
    "📋 Playbook generation — AI-generated IR playbooks from exercises",
    "📥 PDF + Word export for playbooks",
    "📚 Playbook Library — auto-saved, searchable, deletable",
    "🎓 Certificate PDFs — A4 landscape, dark-themed, grade badges",
    "📜 My Certificates — active/expired split with 1-year expiry",
    "🎭 Character editing — ✏️ button, pre-fills form",
    "🧠 AI learning — last 20 scenarios passed to prevent repeats",
    "🎨 Custom branding — logo, name, colours stored in DB",
  ]},
  { version: "0.3.0", date: "6 Apr 2026", title: "Multiplayer + Integrations", type: "feature", items: [
    "👥 Real-time multiplayer via Pusher — lobby, live scoring, scoreboard",
    "🚨 8 SIEM/XDR connectors — CrowdStrike, Taegis, Defender, Sentinel, Splunk, Elastic, Tenable, Cortex",
    "🎯 Build TTX from live alerts — one-click exercise generation",
    "💬 Slack bot — /threatcast commands (run, status, leaderboard, themes)",
    "📧 Email verification on registration",
    "📖 User Guide — 10 sections, 40+ Q&As",
    "🔗 Shared exercise viewer — public token-based access",
    "🎫 In-app support tickets — submit + admin reply + notification dot",
  ]},
  { version: "0.2.0", date: "5 Apr 2026", title: "Core Exercise Engine", type: "feature", items: [
    "🎯 AI-generated exercises via Anthropic Claude",
    "📝 21 threat themes with difficulty levels",
    "🎭 Custom character system with personality traits",
    "⏱️ 3-second answer pacing (read the explanation)",
    "🔄 Exercise cloning — team members can attempt others' exercises",
    "⭐ Star rating feedback (1-5) on completion",
  ]},
  { version: "0.1.0", date: "5 Apr 2026", title: "Platform Foundation", type: "feature", items: [
    "🔐 NextAuth.js v5 — email/password auth with bcrypt",
    "🏢 Multi-tenant — org-based isolation with subdomain routing",
    "👤 RBAC — SUPER_ADMIN, CLIENT_ADMIN, MEMBER",
    "🌍 i18n — 12 language exercise generation",
    "🔒 MFA — TOTP authenticator support",
    "📧 Resend transactional emails",
    "🗄️ Neon PostgreSQL + Prisma ORM",
    "🚀 Vercel deployment with custom domain",
  ]},
];

const tc: Record<string, string> = { feature: "bg-cyber-600/20 text-cyber-400", security: "bg-red-500/20 text-red-400", fix: "bg-yellow-500/20 text-yellow-400" };

export default function ChangelogPage() {
  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl font-bold text-white">Changelog</h1><p className="text-gray-500 text-xs mt-1">Platform release history · {CHANGELOG.length} releases · {CHANGELOG.reduce((a, r) => a + r.items.length, 0)} changes</p></div>
      <div className="space-y-4">{CHANGELOG.map(r => (
        <div key={r.version} className="cyber-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-white text-sm font-bold">v{r.version}</span>
              <span className={`cyber-badge text-xs ${tc[r.type] || tc.feature}`}>{r.type}</span>
            </div>
            <span className="text-gray-600 text-xs">{r.date}</span>
          </div>
          <h2 className="text-white text-sm font-semibold mb-2">{r.title}</h2>
          <div className="space-y-1">{r.items.map((item, i) => (
            <p key={i} className="text-gray-400 text-xs leading-relaxed">{item}</p>
          ))}</div>
        </div>
      ))}</div>
    </div>
  );
}
