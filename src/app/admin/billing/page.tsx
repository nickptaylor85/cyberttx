import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

const PLAN_PRICES: Record<string, number> = { FREE: 0, STARTER: 99, GROWTH: 599, PROFESSIONAL: 1499, ENTERPRISE: 3499 };

export default async function BillingPage() {
  const orgs = await db.organization.findMany({ include: { _count: { select: { users: true, ttxSessions: true } } } });
  const mrr = orgs.reduce((sum, o) => sum + (PLAN_PRICES[o.plan] || 0), 0);
  const arr = mrr * 12;
  const byPlan = Object.entries(PLAN_PRICES).map(([plan, price]) => {
    const count = orgs.filter(o => o.plan === plan).length;
    return { plan, price, count, revenue: count * price };
  }).filter(p => p.count > 0 || p.price > 0);

  // Revenue forecast (simple projection)
  const activeClients = orgs.filter(o => o._count.ttxSessions > 0).length;
  const totalClients = orgs.length;
  const avgRevPerClient = totalClients > 0 ? mrr / totalClients : 0;

  // Growth scenarios
  const scenarios = [
    { label: "Conservative", newClients: 5, churn: 0.05 },
    { label: "Base case", newClients: 10, churn: 0.03 },
    { label: "Aggressive", newClients: 20, churn: 0.02 },
  ];

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Billing & Revenue</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">{orgs.length} clients</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-cyber-400">£{mrr.toLocaleString()}</p><p className="text-gray-500 text-xs">MRR</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-green-400">£{arr.toLocaleString()}</p><p className="text-gray-500 text-xs">ARR</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-white">{totalClients}</p><p className="text-gray-500 text-xs">Total Clients</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-purple-400">{activeClients}</p><p className="text-gray-500 text-xs">Active (ran TTX)</p></div>
      </div>

      {/* Revenue by plan */}
      <div className="cyber-card mb-6">
        <h2 className="text-white text-sm font-semibold mb-3">Revenue by Plan</h2>
        <div className="space-y-2">{byPlan.map(p => (
          <div key={p.plan} className="flex items-center justify-between py-2 border-b border-surface-3/50 last:border-0">
            <div className="flex items-center gap-3"><span className="text-white text-sm font-medium w-28">{p.plan}</span><span className="text-gray-500 text-xs">£{p.price}/mo × {p.count} clients</span></div>
            <span className="text-cyber-400 font-mono text-sm">£{p.revenue.toLocaleString()}/mo</span>
          </div>
        ))}</div>
      </div>

      {/* 12-month forecast */}
      <div className="cyber-card mb-6">
        <h2 className="text-white text-sm font-semibold mb-3">12-Month Revenue Forecast</h2>
        <div className="grid sm:grid-cols-3 gap-3">{scenarios.map(s => {
          const months = Array.from({ length: 12 }, (_, m) => {
            const clients = Math.max(0, Math.round(totalClients * Math.pow(1 - s.churn, m + 1) + s.newClients * (m + 1)));
            return clients * (avgRevPerClient || 599);
          });
          const total = months.reduce((a, b) => a + b, 0);
          const endMrr = months[11];
          return (
            <div key={s.label} className="p-3 bg-surface-0 rounded-lg border border-surface-3">
              <p className="text-white text-sm font-medium mb-1">{s.label}</p>
              <p className="text-gray-500 text-xs mb-2">+{s.newClients}/mo · {s.churn * 100}% churn</p>
              <p className="text-cyber-400 font-display text-xl font-bold">£{Math.round(total / 1000)}k</p>
              <p className="text-gray-500 text-xs">12-mo total · £{Math.round(endMrr).toLocaleString()} end MRR</p>
            </div>
          );
        })}</div>
      </div>

      {/* Client list */}
      <div className="cyber-card">
        <h2 className="text-white text-sm font-semibold mb-3">All Clients</h2>
        <div className="space-y-2">{orgs.map(o => (
          <div key={o.id} className="flex items-center justify-between py-2 border-b border-surface-3/50 last:border-0">
            <div><p className="text-white text-sm">{o.name}</p><p className="text-gray-500 text-xs">{o._count.users} users · {o._count.ttxSessions} sessions</p></div>
            <div className="flex items-center gap-2">
              <span className="cyber-badge text-xs bg-surface-3 text-gray-400">{o.plan}</span>
              <span className="text-cyber-400 font-mono text-xs">£{PLAN_PRICES[o.plan] || 0}/mo</span>
            </div>
          </div>
        ))}</div>
      </div>
    </div>
  );
}
