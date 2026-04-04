"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Character {
  id: string;
  name: string;
  role: string;
  department: string;
  description: string;
  expertise: string[];
  isRecurring: boolean;
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
  "Customer Support", "Product", "DevOps", "Infrastructure",
];

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Character | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", role: "", department: "", description: "", expertise: [] as string[], isRecurring: true,
  });
  const [saving, setSaving] = useState(false);
  const [expertiseInput, setExpertiseInput] = useState("");

  useEffect(() => {
    fetchCharacters();
  }, []);

  async function fetchCharacters() {
    const res = await fetch("/api/portal/characters");
    if (res.ok) {
      setCharacters(await res.json());
    }
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: "", role: "", department: "", description: "", expertise: [], isRecurring: true });
    setShowForm(true);
  }

  function openEdit(char: Character) {
    setEditing(char);
    setForm({
      name: char.name, role: char.role, department: char.department || "",
      description: char.description || "", expertise: char.expertise || [], isRecurring: char.isRecurring,
    });
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const method = editing ? "PATCH" : "POST";
    const url = editing ? `/api/portal/characters/${editing.id}` : "/api/portal/characters";
    
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    
    setSaving(false);
    setShowForm(false);
    fetchCharacters();
  }

  async function deleteChar(id: string) {
    if (!confirm("Remove this character?")) return;
    await fetch(`/api/portal/characters/${id}`, { method: "DELETE" });
    fetchCharacters();
  }

  function addExpertise() {
    if (expertiseInput.trim() && !form.expertise.includes(expertiseInput.trim())) {
      setForm({ ...form, expertise: [...form.expertise, expertiseInput.trim()] });
      setExpertiseInput("");
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading characters...</div>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">TTX Characters</h1>
          <p className="text-gray-500 text-sm mt-1">
            Define recurring personas for your scenarios. The AI will weave these characters into the narrative, 
            using their names, roles, and expertise to create realistic interactions.
          </p>
        </div>
        <button onClick={openCreate} className="cyber-btn-primary">+ Add Character</button>
      </div>

      {/* Info box */}
      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <p className="text-blue-400 text-sm font-medium mb-1">💡 How characters work</p>
        <p className="text-gray-400 text-sm">
          Characters you create here appear in your TTX scenarios as named actors — the CISO who gets the 3am call, 
          the SOC analyst who spots the anomaly, the CEO demanding answers. The AI references their expertise 
          and personality to create realistic decision points and dialogue.
        </p>
      </div>

      {/* Character Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-1 border border-surface-3 rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-xl font-bold text-white mb-6">
              {editing ? "Edit Character" : "Create Character"}
            </h2>
            <form onSubmit={save} className="space-y-5">
              <div>
                <label className="cyber-label">Full Name</label>
                <input className="cyber-input" placeholder="e.g. Sarah Mitchell" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="cyber-label">Role / Title</label>
                  <input className="cyber-input" placeholder="e.g. CISO" value={form.role} list="roles"
                    onChange={(e) => setForm({ ...form, role: e.target.value })} required />
                  <datalist id="roles">
                    {SUGGESTED_ROLES.map((r) => <option key={r} value={r} />)}
                  </datalist>
                </div>
                <div>
                  <label className="cyber-label">Department</label>
                  <input className="cyber-input" placeholder="e.g. Information Security" value={form.department} list="depts"
                    onChange={(e) => setForm({ ...form, department: e.target.value })} />
                  <datalist id="depts">
                    {DEPARTMENTS.map((d) => <option key={d} value={d} />)}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="cyber-label">Description & Personality</label>
                <textarea className="cyber-input min-h-[100px]"
                  placeholder="e.g. 15 years experience in financial services security. Calm under pressure but tends to escalate quickly. Prefers data-driven decisions. Known for questioning assumptions."
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="cyber-label">Areas of Expertise</label>
                <div className="flex gap-2 mb-2">
                  <input className="cyber-input flex-1" placeholder="e.g. incident response" value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addExpertise())} />
                  <button type="button" onClick={addExpertise} className="cyber-btn-secondary">Add</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {form.expertise.map((exp, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-3 rounded-lg text-xs text-gray-300">
                      {exp}
                      <button type="button" onClick={() => setForm({ ...form, expertise: form.expertise.filter((_, j) => j !== i) })}
                        className="text-gray-500 hover:text-red-400">×</button>
                    </span>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                  className="w-4 h-4 rounded bg-surface-2 border-surface-4 text-cyber-600 focus:ring-cyber-600" />
                <span className="text-gray-300 text-sm">Recurring character (appears in all future scenarios)</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="cyber-btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="cyber-btn-primary flex-1">
                  {saving ? "Saving..." : editing ? "Update Character" : "Create Character"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Character List */}
      {characters.length === 0 ? (
        <div className="cyber-card text-center py-16">
          <p className="text-4xl mb-3">🎭</p>
          <p className="text-gray-400 mb-2">No characters yet</p>
          <p className="text-gray-500 text-sm mb-4 max-w-md mx-auto">
            Create your team&apos;s cast — the people who&apos;ll populate your incident scenarios.
          </p>
          <button onClick={openCreate} className="cyber-btn-primary">Create Your First Character</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {characters.map((char) => (
            <div key={char.id} className="cyber-card group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-semibold">{char.name}</h3>
                  <p className="text-cyber-400 text-sm">{char.role}</p>
                  {char.department && <p className="text-gray-500 text-xs">{char.department}</p>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(char)} className="p-1.5 rounded hover:bg-surface-3 text-gray-400 hover:text-white">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => deleteChar(char.id)} className="p-1.5 rounded hover:bg-surface-3 text-gray-400 hover:text-red-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              {char.description && (
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{char.description}</p>
              )}
              {char.expertise?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {char.expertise.map((exp, i) => (
                    <span key={i} className="px-2 py-0.5 bg-surface-3 rounded text-xs text-gray-400">{exp}</span>
                  ))}
                </div>
              )}
              {char.isRecurring && (
                <span className="mt-3 inline-block cyber-badge bg-purple-500/20 text-purple-400 border-purple-500/30">Recurring</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
