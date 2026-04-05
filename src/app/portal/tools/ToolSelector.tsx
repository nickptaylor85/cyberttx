"use client";
import { useState } from "react";

interface Tool { id: string; name: string; vendor: string; category: string; }

export default function ToolSelector({ categories, initialSelected }: { categories: Record<string, Tool[]>; initialSelected: string[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(id: string) {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  async function save() {
    setSaving(true);
    await fetch("/api/portal/tools", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolIds: Array.from(selected) }),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      {Object.entries(categories).map(([category, tools]) => (
        <div key={category} className="mb-6">
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">{category}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {tools.map(tool => (
              <button key={tool.id} onClick={() => toggle(tool.id)}
                className={`p-3 rounded-lg border text-left text-sm transition-all ${
                  selected.has(tool.id)
                    ? "bg-cyber-600/15 border-cyber-500 text-cyber-400"
                    : "bg-surface-0 border-surface-3 text-gray-400 hover:border-surface-4"
                }`}>
                <p className="font-medium text-xs">{tool.name}</p>
                <p className="text-gray-600 text-xs mt-0.5">{tool.vendor}</p>
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-3 mt-4">
        <button onClick={save} disabled={saving} className="cyber-btn-primary text-sm disabled:opacity-50">{saving ? "Saving..." : saved ? "✓ Saved" : `Save (${selected.size} selected)`}</button>
        {saved && <span className="text-green-400 text-xs">Security stack updated</span>}
      </div>
    </div>
  );
}
