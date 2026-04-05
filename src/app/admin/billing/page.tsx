import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const orgs = await db.organization.findMany({ select: { id: true, name: true, plan: true, stripeSubscriptionId: true, _count: { select: { users: true, ttxSessions: true } } }, orderBy: { createdAt: "desc" } });
  const plans: Record<string, number> = {};
  let paid = 0;
  orgs.forEach(o => { plans[o.plan] = (plans[o.plan] || 0) + 1; if (o.stripeSubscriptionId) paid++; });
  const mrr = (plans["STARTER"] || 0) * 599 + (plans["PROFESSIONAL"] || 0) * 1499 + (plans["ENTERPRISE"] || 0) * 3499;
  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Billing Overview</h1></div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-cyber-400">£{mrr.toLocaleString()}</p><p className="text-gray-500 text-xs mt-1">Est. MRR</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-green-400">{paid}</p><p className="text-gray-500 text-xs mt-1">Paid Customers</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-white">{orgs.length}</p><p className="text-gray-500 text-xs mt-1">Total Orgs</p></div>
      </div>
      <div className="cyber-card"><h2 className="font-display text-base font-semibold text-white mb-4">Clients</h2>
        <div className="space-y-2">{orgs.map(o => (
          <div key={o.id} className="flex items-center justify-between py-2 border-b border-surface-3/50 last:border-0">
            <div><p className="text-white text-sm">{o.name}</p><p className="text-gray-500 text-xs">{o._count.users} users · {o._count.ttxSessions} sessions</p></div>
            <span className="cyber-badge bg-surface-3 text-gray-400 text-xs">{o.plan}</span>
          </div>
        ))}</div>
      </div>
    </div>
  );
}
