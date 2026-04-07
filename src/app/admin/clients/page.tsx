"use client";
import { useState, useEffect, useTransition } from "react";
import { getOrganizations, createOrganization, deleteOrganization } from "../actions";
import Link from "next/link";

interface Org { id: string; name: string; slug: string; plan: string; isDemo: boolean; maxUsers: number; maxTtxPerMonth: number; createdAt: string; ttxUsedThisMonth: number; _count: { users: number; ttxSessions: number }; }

export default function ClientsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [showCreate, setShowCreate] = useState(false); const [search, setSearch] = useState("");
  const [name, setName] = useState(""); const [slug, setSlug] = useState(""); const [plan, setPlan] = useState("GROWTH");
  const [isDemo, setIsDemo] = useState(false); const [unlimited, setUnlimited] = useState(false);
  const [domains, setDomains] = useState(""); const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => { loadOrgs(); }, []);
  async function loadOrgs() { try { const data = await getOrganizations(); setOrgs(data as any); } catch {} }

  function handleNameChange(v: string) { setName(v); setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")); }

  async function handleCreate() {
    setError("");
    startTransition(async () => {
      try {
        const limits: Record<string, { users: number; ttx: number }> = { STARTER: { users: 10, ttx: 10 }, GROWTH: { users: 25, ttx: 25 }, PROFESSIONAL: { users: 50, ttx: 999 }, ENTERPRISE: { users: 999, ttx: 999 } };
        const l = limits[plan] || limits.GROWTH;
        const org = await createOrganization({ name, slug, plan, isDemo, maxUsers: unlimited ? 9999 : l.users, maxTtxPerMonth: unlimited ? 9999 : l.ttx });
        if (domains.trim()) {
          try { await fetch("/api/admin/domains", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orgId: (org as any).id, domains: domains.split(",").map((d: string) => d.trim()) }) }); } catch {}
        }
        setName(""); setSlug(""); setShowCreate(false); setIsDemo(false); setUnlimited(false); setDomains(""); loadOrgs();
      } catch (e: any) { setError(e.message || "Failed"); }
    });
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}" and ALL its data?`)) return;
    try { await deleteOrganization(id); setOrgs(o => o.filter(x => x.id !== id)); } catch {}
  }

  // Health scoring
  function healthScore(o: Org): { score: number; color: string; label: string } {
    let score = 0;
    if (o._count.users > 0) score += 25;
    if (o._count.ttxSessions > 0) score += 25;
    if (o._count.ttxSessions >= 3) score += 25;
    if (o.ttxUsedThisMonth > 0) score += 25;
    const color = score >= 75 ? "text-green-400" : score >= 50 ? "text-yellow-400" : score >= 25 ? "text-orange-400" : "text-red-400";
    const label = score >= 75 ? "Healthy" : score >= 50 ? "Engaged" : score >= 25 ? "At Risk" : "Inactive";
    return { score, color, label };
  }

  const filtered = orgs.filter(o => !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.slug.toLowerCase().includes(search.toLowerCase()));
  const rc: Record<string, string> = { FREE: "text-gray-400", STARTER: "text-green-400", GROWTH: "text-cyan-400", PROFESSIONAL: "text-blue-400", ENTERPRISE: "text-purple-400" };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Client Portals</h1><p className="text-gray-500 text-xs mt-1">{orgs.length} portals</p></div>
        <button onClick={() => setShowCreate(!showCreate)} className={showCreate ? "cyber-btn-secondary text-sm" : "cyber-btn-primary text-sm"}>{showCreate ? "Cancel" : "+ New Portal"}</button>
      </div>

      {/* Search */}
      <input className="cyber-input w-full mb-4 text-sm" placeholder="Search portals by name or slug..." value={search} onChange={e => setSearch(e.target.value)} />

      {showCreate && (
        <div className="cyber-card border-cyber-600/30 mb-4">
          <h2 className="text-white text-base font-semibold mb-4">Create Client Portal</h2>
          <div className="space-y-3">
            <div><label className="cyber-label">Company Name</label><input className="cyber-input w-full" value={name} onChange={e => handleNameChange(e.target.value)} placeholder="Acme Corporation" /></div>
            <div><label className="cyber-label">Subdomain</label><div className="flex"><input className="cyber-input flex-1 rounded-r-none" value={slug} onChange={e => setSlug(e.target.value)} /><span className="bg-surface-0 border border-l-0 border-surface-3 rounded-r-lg px-3 flex items-center text-gray-500 text-sm">.threatcast.io</span></div></div>
            <div><label className="cyber-label">Plan</label><div className="flex gap-2">{["STARTER", "GROWTH", "PROFESSIONAL", "ENTERPRISE"].map(p => (
              <button key={p} onClick={() => setPlan(p)} className={`text-xs px-3 py-1.5 rounded border ${plan === p ? "bg-cyber-600/15 border-cyber-500 text-cyber-400" : "bg-surface-0 border-surface-3 text-gray-400"}`}>{p}</button>
            ))}</div></div>
            <div><label className="cyber-label">Allowed Email Domains</label><input className="cyber-input w-full" value={domains} onChange={e => setDomains(e.target.value)} placeholder="acme.com, acme.co.uk" /><p className="text-gray-600 text-xs mt-1">Comma-separated. Auto-links signups.</p></div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isDemo} onChange={e => setIsDemo(e.target.checked)} className="accent-cyber-500" /><span className="text-sm text-gray-300">Demo</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={unlimited} onChange={e => setUnlimited(e.target.checked)} className="accent-cyber-500" /><span className="text-sm text-gray-300">Unlimited</span></label>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button onClick={handleCreate} disabled={isPending || !name || !slug} className="cyber-btn-primary text-sm disabled:opacity-50">{isPending ? "Creating..." : "Create Portal"}</button>
          </div>
        </div>
      )}

      <div className="space-y-2">{filtered.map(org => {
        const h = healthScore(org);
        return (
          <div key={org.id} className="cyber-card">
            <div className="flex items-center justify-between">
              <div className="min-w-0 mr-3">
                <div className="flex items-center gap-2"><p className="text-white text-sm font-semibold">{org.name}</p><span className={`text-xs font-mono ${h.color}`}>{h.label}</span></div>
                <p className="text-gray-500 text-xs">{org.slug}.threatcast.io · <span className={rc[org.plan]}>{org.plan}</span>{org.isDemo ? " · Demo" : ""}{org.maxTtxPerMonth >= 9999 ? " · ∞" : ` · ${org.ttxUsedThisMonth}/${org.maxTtxPerMonth}`}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
                <span>{org._count.users}u</span><span>{org._count.ttxSessions}ex</span>
                <div className="flex gap-1.5">
                  <Link href={`/admin/clients/${org.id}`} className="cyber-btn-primary text-xs py-1 px-2">Details</Link>
                  <a href={`/portal?org=${org.slug}`} target="_blank" className="cyber-btn-secondary text-xs py-1 px-2">View as ↗</a>
                  <button onClick={() => handleDelete(org.id, org.name)} className="cyber-btn-danger text-xs py-1 px-2">✕</button>
                </div>
              </div>
            </div>
          </div>
        );
      })}</div>
    </div>
  );
}
