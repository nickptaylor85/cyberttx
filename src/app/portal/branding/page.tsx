"use client";
import { useState, useEffect } from "react";

export default function BrandingPage() {
  const [primaryColor, setPrimaryColor] = useState("#14b89a");
  const [logoUrl, setLogoUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load saved branding on mount
  useEffect(() => {
    fetch("/api/portal/branding")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setCompanyName(d.portalName || "");
          setLogoUrl(d.logoUrl || "");
          setPrimaryColor(d.primaryColor || "#14b89a");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/portal/branding", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portalName: companyName, logoUrl, primaryColor }),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    else alert("Failed to save branding");
  }

  if (loading) return <p className="text-gray-500 text-center py-12">Loading...</p>;

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Custom Branding</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">Enterprise plan · Customize your portal appearance</p></div>

      <div className="cyber-card mb-4">
        <h2 className="text-white text-sm font-semibold mb-3">Portal Name</h2>
        <input className="cyber-input w-full" placeholder="e.g. Barclays Cyber Training" value={companyName} onChange={e => setCompanyName(e.target.value)} />
        <p className="text-gray-600 text-xs mt-1">Replaces &quot;ThreatCast&quot; in sidebar and headers</p>
      </div>

      <div className="cyber-card mb-4">
        <h2 className="text-white text-sm font-semibold mb-3">Logo URL</h2>
        <input className="cyber-input w-full" placeholder="https://your-cdn.com/logo.png" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} />
        <p className="text-gray-600 text-xs mt-1">Square logo, minimum 128×128px. PNG or SVG.</p>
      </div>

      <div className="cyber-card mb-4">
        <h2 className="text-white text-sm font-semibold mb-3">Primary Colour</h2>
        <div className="flex items-center gap-3">
          <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-12 h-10 rounded cursor-pointer bg-transparent border-0" />
          <input className="cyber-input w-32 font-mono" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
          <div className="h-10 flex-1 rounded-lg" style={{ backgroundColor: primaryColor }} />
        </div>
      </div>

      <div className="cyber-card mb-4">
        <h2 className="text-white text-sm font-semibold mb-3">Preview</h2>
        <div className="bg-surface-0 rounded-lg p-4 border border-surface-3">
          <div className="flex items-center gap-2 mb-3">
            {logoUrl ? <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded" /> : <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}><span className="text-white text-xs font-bold">TC</span></div>}
            <span className="text-white text-sm font-bold">{companyName || "ThreatCast"}</span>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded text-xs text-white" style={{ backgroundColor: primaryColor }}>Primary Button</button>
            <button className="px-3 py-1.5 rounded text-xs border border-surface-3 text-gray-400">Secondary</button>
          </div>
        </div>
      </div>

      <button onClick={save} disabled={saving} className="cyber-btn-primary disabled:opacity-50">
        {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Branding"}
      </button>
      <p className="text-gray-600 text-xs mt-2">Branding applies to your portal, certificates, and reports. &quot;Powered by ThreatCast&quot; appears in footer.</p>
    </div>
  );
}
