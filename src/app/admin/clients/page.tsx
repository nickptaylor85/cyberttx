"use client";

import { useState, useEffect, useTransition } from "react";
import { getOrganizations, createOrganization, deleteOrganization } from "../actions";
import Link from "next/link";

interface Org { id: string; name: string; slug: string; plan: string; isDemo: boolean; maxUsers: number; maxTtxPerMonth: number; createdAt: string; _count: { users: number; ttxSessions: number } }

export default function ClientsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState(""); const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState("GROWTH");
  const [isDemo, setIsDemo] = useState(false);
  const [unlimited, setUnlimited] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => { loadOrgs(); }, []);

  async function loadOrgs() {
    try { const data = await getOrganizations(); setOrgs(data as any); } catch {}
  }

  function handleNameChange(v: string) {
    setName(v);
    setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  }

  async function handleCreate() {
    setError("");
    startTransition(async () => {
      try {
        const planLimits: Record<string, { users: number; ttx: number }> = {
          GROWTH: { users: 25, ttx: 15 },
          PROFESSIONAL: { users: 75, ttx: 50 },
          ENTERPRISE: { users: 999, ttx: 999 },
        };
        const limits = planLimits[plan] || planLimits.GROWTH;
        await createOrganization({
          name, slug,
          plan,
          isDemo,
          maxUsers: unlimited ? 9999 : limits.users,
          maxTtxPerMonth: unlimited ? 9999 : limits.ttx,
        });
        setName(""); setSlug(""); setShowCreate(false); setIsDemo(false); setUnlimited(false);
        loadOrgs();
      } catch (e: any) { setError(e.message || "Failed to create"); }
    });
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}" and ALL its data?`)) return;
    try { await deleteOrganization(id); setOrgs(o => o.filter(x => x.id !== id)); } catch {}
  }

  const rc: Record<string, string> = { FREE: "text-gray-400", STARTER: "text-gray-400", GROWTH: "text-green-400", PROFESSIONAL: "text-blue-400", ENTERPRISE: "text-purple-400" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Client Portals</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">{orgs.length} portals</p></div>
        <button onClick={() => setShowCreate(!showCreate)} className={showCreate ? "cyber-btn-secondary text-sm" : "cyber-btn-primary text-sm"}>{showCreate ? "Cancel" : "+ New Portal"}</button>
      </div>

      {showCreate && (
        <div className="cyber-card border-cyber-600/30 mb-6">
          <h2 className="text-white text-base font-semibold mb-4">Create Client Portal</h2>
          <div className="space-y-3">
            <div><label className="cyber-label">Company Name</label><input className="cyber-input w-full" value={name} onChange={e => handleNameChange(e.target.value)} placeholder="Acme Corporation" /></div>
            <div><label className="cyber-label">Subdomain</label><div className="flex"><input className="cyber-input flex-1 rounded-r-none" value={slug} onChange={e => setSlug(e.target.value)} /><span className="bg-surface-0 border border-l-0 border-surface-3 rounded-r-lg px-3 flex items-center text-gray-500 text-sm">.threatcast.io</span></div></div>
            <div><label className="cyber-label">Plan</label><div className="flex gap-2">{["GROWTH", "PROFESSIONAL", "ENTERPRISE"].map(p => (
              <button key={p} onClick={() => setPlan(p)} className={`text-xs px-3 py-1.5 rounded border transition-colors ${plan === p ? "bg-cyber-600/15 border-cyber-500 text-cyber-400" : "bg-surface-0 border-surface-3 text-gray-400"}`}>{p}</button>
            ))}</div></div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isDemo} onChange={e => setIsDemo(e.target.checked)} className="accent-cyber-500" /><span className="text-sm text-gray-300">Demo portal</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={unlimited} onChange={e => setUnlimited(e.target.checked)} className="accent-cyber-500" /><span className="text-sm text-gray-300">Unlimited exercises</span></label>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button onClick={handleCreate} disabled={isPending || !name || !slug} className="cyber-btn-primary text-sm disabled:opacity-50">{isPending ? "Creating..." : "Create Portal"}</button>
          </div>
        </div>
      )}

      <div className="space-y-3">{orgs.map(org => (
        <div key={org.id} className="cyber-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-semibold">{org.name}</p>
              <p className="text-gray-500 text-xs">{org.slug}.threatcast.io · <span className={rc[org.plan]}>{org.plan}</span>{org.isDemo ? " · Demo" : ""}{org.maxTtxPerMonth >= 9999 ? " · Unlimited" : ""}</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>{org._count.users} users</span><span>{org._count.ttxSessions} sessions</span>
              <div className="flex gap-1.5">
                <Link href={`/admin/clients/${org.id}`} className="cyber-btn-primary text-xs py-1.5 px-3">Details</Link>
                <a href={`/portal?org=${org.slug}`} target="_blank" className="cyber-btn-secondary text-xs py-1.5 px-3">Open ↗</a>
                <button onClick={() => handleDelete(org.id, org.name)} className="cyber-btn-danger text-xs py-1.5 px-3">Delete</button>
              </div>
            </div>
          </div>
        </div>
      ))}</div>
    </div>
  );
}
