"use client";

import { useState, useEffect } from "react";

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isDemo: boolean;
  maxUsers: number;
  maxTtxPerMonth: number;
  createdAt: string;
  _count: { users: number; ttxSessions: number };
}

export default function ClientsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", plan: "STARTER", isDemo: false, maxUsers: 15, maxTtxPerMonth: 15 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOrgs();
  }, []);

  async function fetchOrgs() {
    const res = await fetch("/api/admin/orgs");
    if (res.ok) {
      const data = await res.json();
      setOrgs(data);
    }
    setLoading(false);
  }

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ name: "", slug: "", plan: "STARTER", isDemo: false, maxUsers: 15, maxTtxPerMonth: 15 });
      fetchOrgs();
    }
    setSaving(false);
  }

  async function deleteOrg(id: string, name: string) {
    if (!confirm(`Delete "${name}" and ALL its data? This cannot be undone.`)) return;
    await fetch(`/api/admin/orgs/${id}`, { method: "DELETE" });
    fetchOrgs();
  }

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Client Portals</h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage client organizations</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="cyber-btn-primary">+ New Portal</button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-1 border border-surface-3 rounded-2xl p-8 w-full max-w-lg">
            <h2 className="font-display text-xl font-bold text-white mb-6">Create Client Portal</h2>
            <form onSubmit={createOrg} className="space-y-5">
              <div>
                <label className="cyber-label">Organization Name</label>
                <input
                  className="cyber-input"
                  placeholder="Acme Corporation"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value, slug: autoSlug(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="cyber-label">Subdomain</label>
                <div className="flex items-center">
                  <input
                    className="cyber-input rounded-r-none"
                    placeholder="acme"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                    required
                  />
                  <span className="px-4 py-2.5 bg-surface-3 border border-l-0 border-surface-4 rounded-r-lg text-gray-500 text-sm">.threatcast.io</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="cyber-label">Plan</label>
                  <select
                    className="cyber-input"
                    value={form.plan}
                    onChange={(e) => setForm({ ...form, plan: e.target.value })}
                  >
                    <option value="FREE">Free</option>
                    <option value="STARTER">Starter</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="cyber-label">Max Users</label>
                  <input type="number" className="cyber-input" value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: parseInt(e.target.value) })} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isDemo"
                  checked={form.isDemo}
                  onChange={(e) => setForm({ ...form, isDemo: e.target.checked, plan: e.target.checked ? "FREE" : form.plan, maxTtxPerMonth: e.target.checked ? 999 : 15 })}
                  className="w-4 h-4 rounded bg-surface-2 border-surface-4 text-cyber-600 focus:ring-cyber-600"
                />
                <label htmlFor="isDemo" className="text-sm text-gray-300">This is a demo/internal portal (unlimited TTX)</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="cyber-btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="cyber-btn-primary flex-1">
                  {saving ? "Creating..." : "Create Portal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Org List */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading...</div>
      ) : orgs.length === 0 ? (
        <div className="cyber-card text-center py-16">
          <p className="text-3xl mb-3">🏢</p>
          <p className="text-gray-400 mb-4">No client portals yet</p>
          <button onClick={() => setShowCreate(true)} className="cyber-btn-primary">Create Your First Portal</button>
        </div>
      ) : (
        <div className="space-y-3">
          {orgs.map((org) => (
            <div key={org.id} className="cyber-card flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-surface-3 flex items-center justify-center text-xl font-display font-bold text-cyber-400">
                  {org.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-medium">{org.name}</h3>
                    {org.isDemo && <span className="cyber-badge bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Demo</span>}
                    <span className="cyber-badge bg-surface-3 text-gray-400 border border-surface-4">{org.plan}</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-0.5">{org.slug}.threatcast.io</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right text-sm">
                  <p className="text-gray-300">{org._count.users} <span className="text-gray-500">users</span></p>
                  <p className="text-gray-300">{org._count.ttxSessions} <span className="text-gray-500">sessions</span></p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`https://${org.slug}.threatcast.io`}
                    target="_blank"
                    className="cyber-btn-secondary text-xs py-1.5 px-3"
                  >
                    Open ↗
                  </a>
                  <button onClick={() => deleteOrg(org.id, org.name)} className="cyber-btn-danger text-xs py-1.5 px-3">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
