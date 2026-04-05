"use client";

import { useState, useEffect, useTransition } from "react";
import { getOrganizations, createOrganization, deleteOrganization } from "../actions";
import Link from "next/link";

interface Organization {
  id: string; name: string; slug: string; plan: string; isDemo: boolean;
  maxUsers: number; maxTtxPerMonth: number; createdAt: string;
  _count: { users: number; ttxSessions: number };
}

export default function ClientsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState(""); const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState("GROWTH");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getOrganizations().then((data: any) => { setOrgs(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  async function handleCreate() {
    setError("");
    startTransition(async () => {
      try {
        const org = await createOrganization({ name, slug, plan });
        setOrgs(prev => [{ ...org, _count: { users: 0, ttxSessions: 0 } } as any, ...prev]);
        setShowCreate(false); setName(""); setSlug("");
      } catch (e: any) { setError(e.message || "Failed to create"); }
    });
  }

  async function handleDelete(id: string, orgName: string) {
    if (!confirm(`Delete "${orgName}" and ALL its data? This cannot be undone.`)) return;
    startTransition(async () => {
      try {
        await deleteOrganization(id);
        setOrgs(prev => prev.filter(o => o.id !== id));
      } catch { alert("Failed to delete"); }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Client Portals</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">{orgs.length} portals</p></div>
        <button onClick={() => setShowCreate(!showCreate)} className="cyber-btn-primary text-sm">{showCreate ? "Cancel" : "+ New Portal"}</button>
      </div>

      {showCreate && (
        <div className="cyber-card border-cyber-600/30 mb-6">
          <h2 className="text-white text-sm font-semibold mb-3">Create Client Portal</h2>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div><label className="text-gray-500 text-xs block mb-1">Company Name</label><input className="cyber-input w-full" placeholder="Acme Corp" value={name} onChange={e => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")); }} /></div>
            <div><label className="text-gray-500 text-xs block mb-1">Subdomain</label><div className="flex"><input className="cyber-input flex-1 rounded-r-none" value={slug} onChange={e => setSlug(e.target.value)} /><span className="bg-surface-2 border border-l-0 border-surface-3 rounded-r-lg px-3 flex items-center text-gray-500 text-xs">.threatcast.io</span></div></div>
          </div>
          <div className="mb-3"><label className="text-gray-500 text-xs block mb-1">Plan</label>
            <div className="flex gap-2">{["GROWTH", "PROFESSIONAL", "ENTERPRISE"].map(p => (
              <button key={p} onClick={() => setPlan(p)} className={`text-xs px-3 py-1.5 rounded border ${plan === p ? "bg-cyber-600/15 border-cyber-500 text-cyber-400" : "bg-surface-0 border-surface-3 text-gray-400"}`}>{p}</button>
            ))}</div>
          </div>
          {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
          <button onClick={handleCreate} disabled={isPending || !name || !slug} className="cyber-btn-primary text-sm disabled:opacity-50">{isPending ? "Creating..." : "Create Portal"}</button>
        </div>
      )}

      {loading ? <p className="text-gray-500 text-center py-12">Loading...</p> :
        <div className="space-y-3">{orgs.map(org => (
          <div key={org.id} className="cyber-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">{org.name}</p>
                <p className="text-gray-500 text-xs">{org.slug}.threatcast.io · {org.plan}{org.isDemo ? " · Demo" : ""}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right mr-2"><p className="text-gray-300 text-xs">{org._count.users} <span className="text-gray-500">users</span></p><p className="text-gray-300 text-xs">{org._count.ttxSessions} <span className="text-gray-500">sessions</span></p></div>
                <div className="flex gap-2">
                  <Link href={`/admin/clients/${org.id}`} className="cyber-btn-primary text-xs py-1.5 px-3">Details</Link>
                  <a href={`/portal?org=${org.slug}`} target="_blank" className="cyber-btn-secondary text-xs py-1.5 px-3">Open ↗</a>
                  <button onClick={() => handleDelete(org.id, org.name)} className="cyber-btn-danger text-xs py-1.5 px-3">Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}</div>
      }
    </div>
  );
}
