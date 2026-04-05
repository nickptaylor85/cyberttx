import { db } from "@/lib/db";
import { headers } from "next/headers";
export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  const h = await headers(); const slug = h.get("x-org-slug") || "demo";
  const org = await db.organization.findUnique({ where: { slug }, select: { name: true, plan: true, stripeSubscriptionId: true } });
  if (!org) return <p className="text-red-400">Org not found</p>;
  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Settings</h1></div>
      <div className="space-y-6">
        <div className="cyber-card"><h2 className="font-display text-base font-semibold text-white mb-3">Subscription</h2><span className="cyber-badge bg-cyber-500/20 text-cyber-400 text-xs">{org.plan}</span></div>
        <div className="cyber-card"><h2 className="font-display text-base font-semibold text-white mb-3">SSO / SAML</h2><p className="text-gray-500 text-sm">{org.plan === "ENTERPRISE" ? "Contact support@threatcast.io to configure." : "Available on Enterprise plan."}</p></div>
        <div className="cyber-card border-red-500/20"><h2 className="font-display text-base font-semibold text-white mb-3">Danger Zone</h2><button className="cyber-btn-danger text-xs py-2 px-4">Delete Organization</button></div>
      </div>
    </div>
  );
}
