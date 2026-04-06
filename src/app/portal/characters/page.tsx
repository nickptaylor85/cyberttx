"use client";

import { useState, useEffect } from "react";

interface Character {
  id: string; name: string; role: string; department: string;
  description: string; expertise: string[]; isRecurring: boolean; createdAt: string;
}

const SUGGESTED_ROLES = [
  "CISO", "SOC Manager", "SOC Analyst (L1)", "SOC Analyst (L2)", "SOC Analyst (L3)",
  "Incident Response Lead", "Threat Hunter", "Security Engineer", "Network Engineer",
  "IT Director", "CTO", "CIO", "Sysadmin", "Help Desk Lead",
  "Compliance Officer", "Legal Counsel", "PR / Comms Director", "CEO",
  "VP of Engineering", "DevOps Lead", "Cloud Architect", "DBA",
];

const DEPARTMENTS = [
  "Information Security", "IT Operations", "Engineering", "Executive Leadership",
  "Legal & Compliance", "Human Resources", "Finance", "Communications",
];

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState(""); const [role, setRole] = useState("");
  const [dept, setDept] = useState(""); const [desc, setDesc] = useState("");
  const [expertise, setExpertise] = useState("");
  const [error, setError] = useState(""); const [saving, setSaving] = useState(false);

  useEffect(() => { loadChars(); }, []);

  async function loadChars() {
    const res = await fetch("/api/portal/characters");
    if (res.ok) setCharacters(await res.json());
    setLoading(false);
  }

  async function create() {
    if (!name || !role) return;
    setError(""); setSaving(true);
    const res = await fetch("/api/portal/characters", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, role, department: dept, description: desc,
        expertise: expertise.split(",").map(e => e.trim()).filter(Boolean),
        isRecurring: true,
      }),
    });
    if (res.ok) {
      setName(""); setRole(""); setDept(""); setDesc(""); setExpertise("");
      setShowCreate(false); loadChars();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create");
    }
    setSaving(false);
  }

  async function deleteChar(id: string) {
    if (!confirm("Delete this character?")) return;
    await fetch(`/api/portal/characters/${id}`, { method: "DELETE" });
    setCharacters(c => c.filter(ch => ch.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Characters</h1>
          <p className="text-gray-500 text-xs mt-1">{characters.length} characters · Shared across your entire portal</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className={showCreate ? "cyber-btn-secondary text-sm" : "cyber-btn-primary text-sm"}>{showCreate ? "Cancel" : "+ New Character"}</button>
      </div>

      <div className="cyber-card mb-4 bg-surface-0/50 border-surface-3/50">
        <p className="text-gray-500 text-xs">Characters are shared with everyone in your portal. When selected for exercises, they&apos;ll act according to their role, expertise, and personality description. AI will reference them by name in scenarios.</p>
      </div>

      {showCreate && (
        <div className="cyber-card mb-4 border-cyber-600/30">
          <h3 className="text-white text-sm font-semibold mb-3">Create Character</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="cyber-label">Name *</label><input className="cyber-input w-full" value={name} onChange={e => setName(e.target.value)} placeholder="Sarah Chen" /></div>
              <div><label className="cyber-label">Role *</label>
                <select className="cyber-input w-full" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="">Select role...</option>
                  {SUGGESTED_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  <option value="custom">Custom role...</option>
                </select>
                {role === "custom" && <input className="cyber-input w-full mt-1" placeholder="Custom role title" onChange={e => setRole(e.target.value)} />}
              </div>
            </div>
            <div><label className="cyber-label">Department</label>
              <select className="cyber-input w-full" value={dept} onChange={e => setDept(e.target.value)}>
                <option value="">Select department...</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div><label className="cyber-label">Personality & Background</label>
              <textarea className="cyber-input w-full h-20 resize-none" value={desc} onChange={e => setDesc(e.target.value)}
                placeholder="e.g. Cautious and methodical. 15 years experience in financial services security. Always insists on following the runbook before escalating. Known for asking tough questions in incident calls." />
              <p className="text-gray-600 text-xs mt-1">This shapes how the character behaves in exercises — their decision style, personality, and communication approach. Max 500 chars.</p>
            </div>
            <div><label className="cyber-label">Expertise</label><input className="cyber-input w-full" value={expertise} onChange={e => setExpertise(e.target.value)} placeholder="SIEM, EDR, network forensics (comma-separated)" /></div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button onClick={create} disabled={saving || !name || !role} className="cyber-btn-primary text-sm disabled:opacity-50">{saving ? "Creating..." : "Create Character"}</button>
          </div>
        </div>
      )}

      {loading ? <p className="text-gray-500 text-center py-8">Loading...</p> :
        characters.length === 0 ? (
          <div className="cyber-card text-center py-12">
            <p className="text-3xl mb-3">🎭</p>
            <p className="text-gray-400 text-sm">No characters yet</p>
            <p className="text-gray-500 text-xs mt-1">Create recurring characters to make exercises more realistic and personal</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {characters.map(c => (
              <div key={c.id} className="cyber-card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-white text-sm font-semibold">{c.name}</p>
                    <p className="text-cyber-400 text-xs">{c.role}{c.department ? ` · ${c.department}` : ""}</p>
                  </div>
                  <button onClick={() => deleteChar(c.id)} className="text-red-400/50 hover:text-red-400 text-xs p-1">✕</button>
                </div>
                {c.description && <p className="text-gray-400 text-xs mb-2 line-clamp-3">{c.description}</p>}
                {c.expertise?.length > 0 && (
                  <div className="flex flex-wrap gap-1">{c.expertise.map(e => <span key={e} className="cyber-badge text-xs bg-surface-3 text-gray-400">{e}</span>)}</div>
                )}
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}
