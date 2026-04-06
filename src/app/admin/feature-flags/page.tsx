"use client";
import { useState, useEffect } from "react";

interface Flag { id: string; label: string; desc: string; }
interface Org { id: string; name: string; slug: string; plan: string; }

export default function FeatureFlagsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [allFlags, setAllFlags] = useState<Flag[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/orgs").then(r => r.ok ? r.json() : []).then(setOrgs);
    fetch("/api/admin/feature-flags").then(r => r.ok ? r.json() : ({} as any)).then((d: any) => setAllFlags(d.allFlags || []));
  }, []);

  async function loadFlags(orgId: string) {
    setSelectedOrg(orgId);
    const res = await fetch(`/api/admin/feature-flags?orgId=${orgId}`);
    const data = await res.json();
    setEnabled(data.enabled || {});
  }

  async function saveFlags() {
    setSaving(true);
    await fetch("/api/admin/feature-flags", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId: selectedOrg, flags: enabled }),
    });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  function toggleFlag(id: string) {
    setEnabled(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function enableAll() { const all: Record<string, boolean> = {}; allFlags.forEach(f => { all[f.id] = true; }); setEnabled(all); }
  function disableAll() { setEnabled({}); }

  // Plan presets
  function applyPlan(plan: string) {
    const starter = ["playbook_export", "certificate_pdf", "i18n", "custom_characters", "weekly_reports"];
    const growth = [...starter, "multiplayer", "siem_integration", "custom_branding", "compliance", "mitre_coverage"];
    const pro = [...growth, "benchmarks", "api_access", "slack_bot"];
    const enterprise = [...pro, "sso"];
    const preset = plan === "STARTER" ? starter : plan === "GROWTH" ? growth : plan === "PROFESSIONAL" ? pro : enterprise;
    const flags: Record<string, boolean> = {};
    preset.forEach(f => { flags[f] = true; });
    setEnabled(flags);
  }

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl font-bold text-white">Feature Flags</h1><p className="text-gray-500 text-xs mt-1">Control which features are available per client portal</p></div>

      {/* Org selector */}
      <div className="cyber-card mb-4">
        <label className="text-gray-400 text-xs mb-2 block">Select Client Portal</label>
        <select className="cyber-input w-full text-sm" value={selectedOrg} onChange={e => loadFlags(e.target.value)}>
          <option value="">Choose a portal...</option>
          {orgs.map(o => <option key={o.id} value={o.id}>{o.name} ({o.slug}) — {o.plan}</option>)}
        </select>
      </div>

      {selectedOrg && <>
        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={enableAll} className="cyber-btn-secondary text-xs">Enable All</button>
          <button onClick={disableAll} className="cyber-btn-secondary text-xs">Disable All</button>
          <button onClick={() => applyPlan("STARTER")} className="cyber-btn-secondary text-xs">Starter Preset</button>
          <button onClick={() => applyPlan("GROWTH")} className="cyber-btn-secondary text-xs">Growth Preset</button>
          <button onClick={() => applyPlan("PROFESSIONAL")} className="cyber-btn-secondary text-xs">Pro Preset</button>
          <button onClick={() => applyPlan("ENTERPRISE")} className="cyber-btn-secondary text-xs">Enterprise Preset</button>
        </div>

        {/* Flag toggles */}
        <div className="cyber-card mb-4 space-y-3">
          {allFlags.map(flag => (
            <div key={flag.id} className="flex items-center justify-between py-1.5 border-b border-surface-3/30 last:border-0">
              <div>
                <p className="text-white text-sm">{flag.label}</p>
                <p className="text-gray-500 text-xs">{flag.desc}</p>
              </div>
              <button
                onClick={() => toggleFlag(flag.id)}
                className={`w-10 h-5 rounded-full transition-colors relative ${enabled[flag.id] ? "bg-green-500" : "bg-surface-4"}`}
              >
                <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all" style={{ left: enabled[flag.id] ? "22px" : "2px" }} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={saveFlags} disabled={saving} className="cyber-btn-primary disabled:opacity-50">
            {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Feature Flags"}
          </button>
          <span className="text-gray-500 text-xs">{Object.values(enabled).filter(Boolean).length}/{allFlags.length} features enabled</span>
        </div>
      </>}
    </div>
  );
}
