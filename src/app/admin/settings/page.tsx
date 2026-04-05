import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

async function getConfig() {
  const [orgCount, userCount, sessionCount, toolCount] = await Promise.all([
    db.organization.count(),
    db.user.count(),
    db.ttxSession.count(),
    db.securityTool.count({ where: { isActive: true } }),
  ]);
  const envStatus = {
    clerk: !!process.env.CLERK_SECRET_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    stripe: !!process.env.STRIPE_SECRET_KEY,
    pusher: !!process.env.NEXT_PUBLIC_PUSHER_KEY,
    database: !!process.env.DATABASE_URL,
    resend: !!process.env.RESEND_API_KEY,
  };
  const isProduction = process.env.CLERK_SECRET_KEY?.startsWith("sk_live_") || false;
  return { orgCount, userCount, sessionCount, toolCount, envStatus, isProduction };
}

export default async function SettingsPage() {
  const c = await getConfig();
  const checks = [
    { name: "Clerk Auth", ok: c.envStatus.clerk, env: "CLERK_SECRET_KEY" },
    { name: "Anthropic AI", ok: c.envStatus.anthropic, env: "ANTHROPIC_API_KEY" },
    { name: "Stripe Billing", ok: c.envStatus.stripe, env: "STRIPE_SECRET_KEY" },
    { name: "Pusher Realtime", ok: c.envStatus.pusher, env: "NEXT_PUBLIC_PUSHER_KEY" },
    { name: "Database", ok: c.envStatus.database, env: "DATABASE_URL" },
    { name: "Resend Email", ok: c.envStatus.resend, env: "RESEND_API_KEY" },
  ];
  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Platform Settings</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">System configuration and health</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[{ label: "Organizations", value: c.orgCount }, { label: "Users", value: c.userCount }, { label: "Exercises", value: c.sessionCount }, { label: "Security Tools", value: c.toolCount }].map(s => (
          <div key={s.label} className="cyber-card text-center"><p className="font-display text-2xl font-bold text-cyber-400">{s.value}</p><p className="text-gray-500 text-xs mt-1">{s.label}</p></div>
        ))}
      </div>
      <div className="cyber-card mb-6">
        <div className="flex items-center justify-between mb-4"><h2 className="font-display text-base font-semibold text-white">Environment</h2><span className={`cyber-badge text-xs ${c.isProduction ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"}`}>{c.isProduction ? "Production" : "Development"}</span></div>
        <div className="space-y-2">
          {checks.map(ch => (
            <div key={ch.name} className="flex items-center justify-between py-2 border-b border-surface-3/50 last:border-0">
              <div><p className="text-white text-sm">{ch.name}</p><p className="text-gray-600 text-xs font-mono">{ch.env}</p></div>
              <span className={`text-xs font-medium ${ch.ok ? "text-green-400" : "text-red-400"}`}>{ch.ok ? "✓ Connected" : "✗ Missing"}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="cyber-card">
        <h2 className="font-display text-base font-semibold text-white mb-3">Threat Intelligence</h2>
        <p className="text-gray-400 text-sm mb-3">Scan for real-world incidents to create exercise templates.</p>
        <form action="/api/threat-intel" method="POST"><button type="submit" className="cyber-btn-primary text-sm">🔍 Scan Now</button></form>
      </div>
    </div>
  );
}
