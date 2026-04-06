import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const orgs = await db.organization.findMany({
    include: { _count: { select: { users: true, ttxSessions: true } } },
  });

  const planPricing: Record<string, number> = { FREE: 0, STARTER: 149, GROWTH: 299, PROFESSIONAL: 599, ENTERPRISE: 1499 };
  // FREE is a trial, not a plan — exclude from revenue
  const totalMRR = orgs.reduce((a, o) => a + (planPricing[o.plan] || 0), 0);
  const totalARR = totalMRR * 12;
  const paidOrgs = orgs.filter(o => o.plan !== "FREE" && !o.isDemo);
  const demoOrgs = orgs.filter(o => o.isDemo);
  const trialOrgs = orgs.filter(o => o.plan === "FREE" && !o.isDemo);

  const planBreakdown = Object.entries(
    orgs.reduce((a, o) => { a[o.plan] = (a[o.plan] || 0) + 1; return a; }, {} as Record<string, number>)
  ).sort((a, b) => (planPricing[b[0]] || 0) - (planPricing[a[0]] || 0));

  const revenueByPlan = planBreakdown.map(([plan, count]) => ({
    plan, count, unitPrice: planPricing[plan] || 0, revenue: (planPricing[plan] || 0) * count,
  }));

  // Forecast
  const monthlyGrowthRates = { conservative: 0.05, base: 0.10, aggressive: 0.20 };
  const forecast = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(Date.now() + (i + 1) * 30 * 86400000).toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
    conservative: Math.round(totalMRR * Math.pow(1 + monthlyGrowthRates.conservative, i + 1)),
    base: Math.round(totalMRR * Math.pow(1 + monthlyGrowthRates.base, i + 1)),
    aggressive: Math.round(totalMRR * Math.pow(1 + monthlyGrowthRates.aggressive, i + 1)),
  }));

  const pc: Record<string, string> = { FREE: "text-gray-400", STARTER: "text-green-400", GROWTH: "text-cyan-400", PROFESSIONAL: "text-blue-400", ENTERPRISE: "text-purple-400" };

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Billing & Revenue</h1></div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-green-400">£{totalMRR.toLocaleString()}</p><p className="text-gray-500 text-xs">MRR</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-cyan-400">£{totalARR.toLocaleString()}</p><p className="text-gray-500 text-xs">ARR</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-white">{paidOrgs.length}</p><p className="text-gray-500 text-xs">Paying Clients</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-yellow-400">{trialOrgs.length}</p><p className="text-gray-500 text-xs">Free/Trial</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-gray-400">{demoOrgs.length}</p><p className="text-gray-500 text-xs">Demo</p></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Revenue by Plan */}
        <div className="cyber-card">
          <h2 className="text-white text-sm font-semibold mb-3">Revenue by Plan</h2>
          <div className="space-y-2">
            {revenueByPlan.map(r => (
              <div key={r.plan} className="flex items-center justify-between py-1.5 border-b border-surface-3/50 last:border-0">
                <div className="flex items-center gap-2"><span className={`font-semibold text-sm ${pc[r.plan]}`}>{r.plan}</span><span className="text-gray-600 text-xs">{r.count} clients</span></div>
                <div className="text-right"><p className="text-white text-sm font-mono">£{r.revenue.toLocaleString()}/mo</p><p className="text-gray-600 text-xs">£{r.unitPrice}/client</p></div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-surface-3">
              <span className="text-white text-sm font-semibold">Total MRR</span>
              <span className="text-green-400 text-sm font-bold font-mono">£{totalMRR.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Plan Pricing Reference */}
        <div className="cyber-card">
          <h2 className="text-white text-sm font-semibold mb-3">Plan Pricing</h2>
          <div className="space-y-2">
            {[
              { plan: "Starter", price: "£149/mo", annual: "£1,490/yr", features: "25 users · 15 TTX/mo · Email support · Basic compliance" },
              { plan: "Growth", price: "£299/mo", annual: "£2,990/yr", features: "50 users · 30 TTX/mo · Priority support · Custom branding · Webhooks" },
              { plan: "Professional", price: "£599/mo", annual: "£5,990/yr", features: "100 users · Unlimited TTX · SSO · Dedicated CSM · API access" },
              { plan: "Enterprise", price: "£1,499/mo", annual: "£14,990/yr", features: "Unlimited · SAML · Custom integrations · SLA · On-prem option" },
            ].map(p => (
              <div key={p.plan} className="p-2 rounded bg-surface-0 border border-surface-3">
                <div className="flex items-center justify-between"><span className="text-white text-sm font-semibold">{p.plan}</span><div className="text-right"><span className="text-cyber-400 text-sm font-mono">{p.price}</span><span className="text-gray-600 text-xs ml-1">({(p as any).annual})</span></div></div>
                <p className="text-gray-500 text-xs mt-1">{p.features}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 12-Month Forecast */}
      <div className="cyber-card mb-6">
        <h2 className="text-white text-sm font-semibold mb-3">12-Month Revenue Forecast</h2>
        <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-2"><span>Conservative (5%)</span><span className="text-center">Base (10%)</span><span className="text-right">Aggressive (20%)</span></div>
        <div className="overflow-x-auto"><table className="w-full text-xs">
          <thead><tr className="border-b border-surface-3">{["Month", "Conservative", "Base", "Aggressive"].map(h => <th key={h} className="text-gray-500 font-normal py-1.5 text-left">{h}</th>)}</tr></thead>
          <tbody>{forecast.map(f => (
            <tr key={f.month} className="border-b border-surface-3/30"><td className="text-gray-400 py-1">{f.month}</td><td className="text-gray-400 font-mono">£{f.conservative.toLocaleString()}</td><td className="text-cyan-400 font-mono">£{f.base.toLocaleString()}</td><td className="text-green-400 font-mono">£{f.aggressive.toLocaleString()}</td></tr>
          ))}</tbody>
        </table></div>
      </div>

      {/* Client Revenue Detail */}
      <div className="cyber-card">
        <h2 className="text-white text-sm font-semibold mb-3">Client Revenue Detail</h2>
        <div className="overflow-x-auto"><table className="w-full text-xs">
          <thead><tr className="border-b border-surface-3">{["Client", "Plan", "Users", "Exercises", "MRR", "Status"].map(h => <th key={h} className="text-gray-500 font-normal py-1.5 text-left">{h}</th>)}</tr></thead>
          <tbody>{orgs.sort((a, b) => (planPricing[b.plan] || 0) - (planPricing[a.plan] || 0)).map(o => (
            <tr key={o.id} className="border-b border-surface-3/30">
              <td className="text-white py-1.5">{o.name}</td>
              <td className={pc[o.plan]}>{o.plan}</td>
              <td className="text-gray-400">{o._count.users}</td>
              <td className="text-gray-400">{o._count.ttxSessions}</td>
              <td className="text-green-400 font-mono">£{(planPricing[o.plan] || 0).toLocaleString()}</td>
              <td>{o.isDemo ? <span className="text-gray-500">Demo</span> : o.plan === "FREE" ? <span className="text-yellow-400">Trial</span> : <span className="text-green-400">Active</span>}</td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>

      {/* Churn Risk */}
      <div className="cyber-card mt-4">
        <h2 className="text-white text-sm font-semibold mb-3">Churn Risk — Inactive Clients</h2>
        <p className="text-gray-500 text-xs mb-3">Clients with no exercises in the last 30 days</p>
        {(() => {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
          const atRisk = orgs.filter(o => !o.isDemo && o.plan !== "FREE" && o._count.ttxSessions > 0).filter(o => {
            return o.ttxUsedThisMonth === 0;
          });
          if (atRisk.length === 0) return <p className="text-green-400 text-xs">No clients at risk of churn</p>;
          return (
            <div className="space-y-2">{atRisk.map(o => (
              <div key={o.id} className="flex items-center justify-between py-1.5 border-b border-red-500/10 last:border-0">
                <div><p className="text-white text-sm">{o.name}</p><p className="text-gray-500 text-xs">{o.plan} · {o._count.users} users · {o._count.ttxSessions} total exercises · 0 this month</p></div>
                <span className="text-red-400 text-xs font-semibold">At Risk</span>
              </div>
            ))}</div>
          );
        })()}
      </div>
    </div>
  );
}
