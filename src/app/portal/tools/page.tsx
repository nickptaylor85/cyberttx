"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Tool {
  id: string;
  name: string;
  vendor: string;
  category: string;
  icon: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  EDR: "Endpoint Detection & Response",
  VULNERABILITY_MANAGEMENT: "Vulnerability Management",
  SIEM: "SIEM",
  XDR: "Extended Detection & Response",
  SOAR: "SOAR / Orchestration",
  IDENTITY: "Identity & Access",
  PAM: "Privileged Access Management",
  EMAIL_SECURITY: "Email Security",
  NETWORK_SECURITY: "Network Security",
  CLOUD_SECURITY: "Cloud Security",
  DLP: "Data Loss Prevention",
  WAF: "Web Application Firewall",
  THREAT_INTELLIGENCE: "Threat Intelligence",
};

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/portal/tools")
      .then((r) => r.json())
      .then((data) => {
        setTools(data.allTools || []);
        setSelected(new Set(data.selectedIds || []));
        setLoading(false);
      });
  }, []);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    await fetch("/api/portal/tools", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolIds: Array.from(selected) }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  // Group by category
  const grouped = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, Tool[]>);

  if (loading) return <div className="text-center py-20 text-gray-500">Loading tools...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Security Stack</h1>
          <p className="text-gray-500 text-sm mt-1">
            Select the tools your organization uses. TTX scenarios will reference these tools specifically.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-green-400 text-sm">✓ Saved</span>}
          <span className="text-gray-500 text-sm">{selected.size} selected</span>
          <button onClick={save} disabled={saving} className="cyber-btn-primary">
            {saving ? "Saving..." : "Save Stack"}
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(grouped).map(([category, categoryTools]) => (
          <div key={category}>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {CATEGORY_LABELS[category] || category}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {categoryTools.map((tool) => {
                const isSelected = selected.has(tool.id);
                return (
                  <button
                    key={tool.id}
                    onClick={() => toggle(tool.id)}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all",
                      isSelected
                        ? "bg-cyber-600/10 border-cyber-600/50 ring-1 ring-cyber-500/20"
                        : "bg-surface-2 border-surface-3 hover:border-surface-4"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{tool.icon}</span>
                      <div className="min-w-0">
                        <p className={cn("text-sm font-medium truncate", isSelected ? "text-white" : "text-gray-300")}>
                          {tool.name}
                        </p>
                        <p className="text-gray-500 text-xs">{tool.vendor}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
