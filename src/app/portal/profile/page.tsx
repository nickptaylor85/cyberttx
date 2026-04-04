"use client";

import { useState, useEffect } from "react";

interface ProfileData {
  industry: string;
  companySize: string;
  headquarters: string;
  operatingRegions: string[];
  primaryCloudProvider: string;
  hasOnPremInfra: boolean;
  endpointCount: string;
  serverCount: string;
  hasOtEnvironment: boolean;
  otDescription: string;
  securityTeamSize: string;
  socModel: string;
  complianceFrameworks: string[];
  incidentFrequency: string;
  networkDescription: string;
  remoteWorkPercentage: string;
  branchOffices: string;
  criticalAssets: string;
  regulatoryBodies: string[];
  recentIncidents: string;
  biggestConcerns: string;
  additionalContext: string;
}

const INDUSTRIES = [
  "Financial Services", "Healthcare", "Technology", "Manufacturing", "Retail & E-commerce",
  "Energy & Utilities", "Government / Public Sector", "Education", "Legal", "Media & Entertainment",
  "Telecommunications", "Transportation & Logistics", "Real Estate", "Pharmaceutical",
  "Defence & Aerospace", "Non-Profit", "Other",
];

const CLOUD_PROVIDERS = ["Azure", "AWS", "GCP", "Multi-Cloud", "Hybrid (Cloud + On-Prem)", "On-Prem Only"];
const SOC_MODELS = ["In-house SOC", "Hybrid (In-house + MDR)", "Fully Outsourced MDR", "No formal SOC"];
const COMPLIANCE = [
  "ISO 27001", "SOC 2", "PCI DSS", "HIPAA", "GDPR", "NIST CSF", "Cyber Essentials",
  "Cyber Essentials Plus", "NIS2", "DORA", "FCA", "SOX", "CMMC", "HITRUST", "Other",
];

const EMPTY_PROFILE: ProfileData = {
  industry: "", companySize: "", headquarters: "", operatingRegions: [],
  primaryCloudProvider: "", hasOnPremInfra: true, endpointCount: "", serverCount: "",
  hasOtEnvironment: false, otDescription: "", securityTeamSize: "", socModel: "",
  complianceFrameworks: [], incidentFrequency: "", networkDescription: "",
  remoteWorkPercentage: "", branchOffices: "", criticalAssets: "", regulatoryBodies: [],
  recentIncidents: "", biggestConcerns: "", additionalContext: "",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/portal/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setProfile({ ...EMPTY_PROFILE, ...data });
        }
        setLoading(false);
      });
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/portal/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function update(field: keyof ProfileData, value: any) {
    setProfile((p) => ({ ...p, [field]: value }));
    setSaved(false);
  }

  function toggleArray(field: keyof ProfileData, value: string) {
    const arr = profile[field] as string[];
    const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    update(field, next);
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading profile...</div>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Company Profile</h1>
          <p className="text-gray-500 text-sm mt-1">
            This information shapes your TTX scenarios — the more detail, the more realistic the exercises.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-green-400 text-sm animate-fade-in">✓ Saved</span>}
          <button onClick={save} disabled={saving} className="cyber-btn-primary">
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Company Basics */}
        <section className="cyber-card">
          <h2 className="font-display text-lg font-semibold text-white mb-5">🏢 Company Basics</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="cyber-label">Industry</label>
              <select className="cyber-input" value={profile.industry} onChange={(e) => update("industry", e.target.value)}>
                <option value="">Select industry...</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="cyber-label">Company Size</label>
              <select className="cyber-input" value={profile.companySize} onChange={(e) => update("companySize", e.target.value)}>
                <option value="">Select size...</option>
                {["1-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10000+"].map((s) => (
                  <option key={s} value={s}>{s} employees</option>
                ))}
              </select>
            </div>
            <div>
              <label className="cyber-label">Headquarters</label>
              <input className="cyber-input" placeholder="e.g. Glasgow, UK" value={profile.headquarters} onChange={(e) => update("headquarters", e.target.value)} />
            </div>
            <div>
              <label className="cyber-label">Operating Regions</label>
              <input className="cyber-input" placeholder="e.g. UK, EU, US (comma-separated)" value={profile.operatingRegions.join(", ")}
                onChange={(e) => update("operatingRegions", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
            </div>
          </div>
        </section>

        {/* IT Environment */}
        <section className="cyber-card">
          <h2 className="font-display text-lg font-semibold text-white mb-5">🖥️ IT Environment</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="cyber-label">Primary Cloud Provider</label>
              <select className="cyber-input" value={profile.primaryCloudProvider} onChange={(e) => update("primaryCloudProvider", e.target.value)}>
                <option value="">Select...</option>
                {CLOUD_PROVIDERS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="cyber-label">Managed Endpoints</label>
              <input className="cyber-input" placeholder="e.g. 2500" value={profile.endpointCount} onChange={(e) => update("endpointCount", e.target.value)} />
            </div>
            <div>
              <label className="cyber-label">Server Count</label>
              <input className="cyber-input" placeholder="e.g. 150 servers" value={profile.serverCount} onChange={(e) => update("serverCount", e.target.value)} />
            </div>
            <div>
              <label className="cyber-label">Remote Workforce</label>
              <input className="cyber-input" placeholder="e.g. 60% hybrid" value={profile.remoteWorkPercentage} onChange={(e) => update("remoteWorkPercentage", e.target.value)} />
            </div>
            <div>
              <label className="cyber-label">Branch Offices</label>
              <input className="cyber-input" placeholder="e.g. 12 offices across UK" value={profile.branchOffices} onChange={(e) => update("branchOffices", e.target.value)} />
            </div>
            <div>
              <label className="cyber-label">Network Architecture</label>
              <input className="cyber-input" placeholder="e.g. Hub-spoke with SASE overlay" value={profile.networkDescription} onChange={(e) => update("networkDescription", e.target.value)} />
            </div>
            <div className="md:col-span-2 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={profile.hasOnPremInfra} onChange={(e) => update("hasOnPremInfra", e.target.checked)}
                  className="w-4 h-4 rounded bg-surface-2 border-surface-4 text-cyber-600 focus:ring-cyber-600" />
                <span className="text-gray-300 text-sm">Has on-premises infrastructure</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={profile.hasOtEnvironment} onChange={(e) => update("hasOtEnvironment", e.target.checked)}
                  className="w-4 h-4 rounded bg-surface-2 border-surface-4 text-cyber-600 focus:ring-cyber-600" />
                <span className="text-gray-300 text-sm">Has OT/ICS environment</span>
              </label>
            </div>
            {profile.hasOtEnvironment && (
              <div className="md:col-span-2">
                <label className="cyber-label">OT Environment Description</label>
                <input className="cyber-input" placeholder="e.g. SCADA systems for manufacturing" value={profile.otDescription} onChange={(e) => update("otDescription", e.target.value)} />
              </div>
            )}
          </div>
        </section>

        {/* Security Posture */}
        <section className="cyber-card">
          <h2 className="font-display text-lg font-semibold text-white mb-5">🛡️ Security Posture</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="cyber-label">Security Team Size</label>
              <input className="cyber-input" placeholder="e.g. 8 analysts, 2 leads, 1 CISO" value={profile.securityTeamSize} onChange={(e) => update("securityTeamSize", e.target.value)} />
            </div>
            <div>
              <label className="cyber-label">SOC Model</label>
              <select className="cyber-input" value={profile.socModel} onChange={(e) => update("socModel", e.target.value)}>
                <option value="">Select...</option>
                {SOC_MODELS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="cyber-label">Typical Incident Frequency</label>
              <input className="cyber-input" placeholder="e.g. 2-3 incidents per month" value={profile.incidentFrequency} onChange={(e) => update("incidentFrequency", e.target.value)} />
            </div>
            <div>
              <label className="cyber-label">Recent Notable Incidents</label>
              <input className="cyber-input" placeholder="Brief description (helps AI tailor scenarios)" value={profile.recentIncidents} onChange={(e) => update("recentIncidents", e.target.value)} />
            </div>
          </div>

          <div className="mt-5">
            <label className="cyber-label">Compliance Frameworks</label>
            <div className="flex flex-wrap gap-2">
              {COMPLIANCE.map((c) => (
                <button key={c} onClick={() => toggleArray("complianceFrameworks", c)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                    profile.complianceFrameworks.includes(c)
                      ? "bg-cyber-600/20 border-cyber-600 text-cyber-400"
                      : "bg-surface-2 border-surface-3 text-gray-400 hover:border-surface-4"
                  }`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Business Context */}
        <section className="cyber-card">
          <h2 className="font-display text-lg font-semibold text-white mb-5">💼 Business Context</h2>
          <div className="space-y-5">
            <div>
              <label className="cyber-label">Critical Assets & Data</label>
              <textarea className="cyber-input min-h-[80px]" placeholder="e.g. Customer PII, financial trading data, intellectual property, payment card data"
                value={profile.criticalAssets} onChange={(e) => update("criticalAssets", e.target.value)} />
            </div>
            <div>
              <label className="cyber-label">Biggest Security Concerns</label>
              <textarea className="cyber-input min-h-[80px]" placeholder="e.g. Ransomware targeting our manufacturing OT, insider threats from contractors"
                value={profile.biggestConcerns} onChange={(e) => update("biggestConcerns", e.target.value)} />
            </div>
            <div>
              <label className="cyber-label">Additional Context for AI</label>
              <textarea className="cyber-input min-h-[100px]" placeholder="Anything else the AI should know when generating scenarios — recent org changes, upcoming migrations, specific threat concerns, etc."
                value={profile.additionalContext} onChange={(e) => update("additionalContext", e.target.value)} />
            </div>
          </div>
        </section>
      </div>

      <div className="sticky bottom-4 flex justify-end mt-6">
        <button onClick={save} disabled={saving} className="cyber-btn-primary shadow-lg shadow-cyber-900/40 px-8">
          {saving ? "Saving..." : "Save Company Profile"}
        </button>
      </div>
    </div>
  );
}
