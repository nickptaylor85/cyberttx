"use client";
import { useState, useEffect } from "react";
import { SUPPORTED_CONNECTORS } from "@/lib/connectors";

export default function IntegrationsPage() {
  const [activeConnectors, setActiveConnectors] = useState<any[]>([]);
  const [expandedConnector, setExpandedConnector] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState(""); const [saved, setSaved] = useState("");
  const [testing, setTesting] = useState("");
  const [webhookUrl, setWebhookUrl] = useState(""); const [teamsUrl, setTeamsUrl] = useState("");
  const [suggestion, setSuggestion] = useState(""); const [suggestionSent, setSuggestionSent] = useState(false);

  useEffect(() => {
    fetch("/api/portal/connectors").then(r => r.ok ? r.json() : []).then(setActiveConnectors).catch(() => {});
  }, []);

  async function saveConnector(type: string) {
    const creds = credentials[type];
    if (!creds) return;
    setSaving(type);
    await fetch("/api/portal/connectors", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, credentials: creds }),
    });
    setSaving(""); setSaved(type); setTimeout(() => setSaved(""), 3000);
    // Refresh
    fetch("/api/portal/connectors").then(r => r.ok ? r.json() : []).then(setActiveConnectors);
  }

  async function testConnector(type: string) {
    setTesting(type);
    try {
      const res = await fetch("/api/portal/alerts");
      const data = await res.json();
      alert(`Test: ${data.alerts?.length || 0} alerts found from ${data.connectors || 0} connectors`);
    } catch { alert("Connection test failed"); }
    setTesting("");
  }

  async function removeConnector(type: string) {
    if (!confirm("Remove this connector?")) return;
    await fetch(`/api/portal/connectors?type=${type}`, { method: "DELETE" });
    setActiveConnectors(c => c.filter(x => x.type !== type));
  }

  function updateCred(type: string, key: string, value: string) {
    setCredentials(prev => ({ ...prev, [type]: { ...(prev[type] || {}), [key]: value } }));
  }

  const isConnected = (type: string) => activeConnectors.some(c => c.type === type);

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Integrations</h1><p className="text-gray-500 text-xs mt-1">Connect security tools to pull real alerts into exercises</p></div>

      {/* SIEM/XDR Connectors */}
      <div className="mb-8">
        <h2 className="text-white text-sm font-semibold mb-3">Security Tool Connectors</h2>
        <p className="text-gray-500 text-xs mb-4">Connect your SIEM, XDR, or scanner. Real alerts from these tools can be used to generate exercises based on actual incidents in your environment.</p>

        <div className="space-y-3">{SUPPORTED_CONNECTORS.map(conn => {
          const connected = isConnected(conn.type);
          const expanded = expandedConnector === conn.type;

          return (
            <div key={conn.type} className={`cyber-card ${connected ? "border-green-500/30" : ""}`}>
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedConnector(expanded ? null : conn.type)}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{conn.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-semibold">{conn.name}</p>
                      {connected && <span className="cyber-badge text-xs bg-green-500/20 text-green-400">Connected</span>}
                    </div>
                    <p className="text-gray-500 text-xs">{conn.description}</p>
                  </div>
                </div>
                <span className={`text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`}>▾</span>
              </div>

              {expanded && (
                <div className="mt-4 pt-4 border-t border-surface-3">
                  <div className="space-y-3">
                    {conn.fields.map(f => (
                      <div key={f.key}>
                        <label className="cyber-label">{f.label}</label>
                        <input
                          type={f.secret ? "password" : "text"}
                          className="cyber-input w-full font-mono text-xs"
                          placeholder={f.placeholder}
                          value={credentials[conn.type]?.[f.key] || ""}
                          onChange={e => updateCred(conn.type, f.key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => saveConnector(conn.type)} disabled={saving === conn.type} className="cyber-btn-primary text-xs disabled:opacity-50">{saving === conn.type ? "Saving..." : saved === conn.type ? "✓ Saved" : "Save & Connect"}</button>
                    {connected && <button onClick={() => testConnector(conn.type)} disabled={testing === conn.type} className="cyber-btn-secondary text-xs">{testing === conn.type ? "Testing..." : "Test"}</button>}
                    {connected && <button onClick={() => removeConnector(conn.type)} className="cyber-btn-danger text-xs">Disconnect</button>}
                    <a href={conn.docsUrl} target="_blank" className="text-gray-500 text-xs hover:text-gray-300 ml-auto">API Docs ↗</a>
                  </div>
                </div>
              )}
            </div>
          );
        })}</div>
      </div>

      {/* Outbound webhooks */}
      <h2 className="text-white text-sm font-semibold mb-3">Outbound Notifications</h2>
      <div className="space-y-3">
        {[
          { id: "teams", name: "Microsoft Teams", icon: "💬", desc: "Post results to Teams channel", val: teamsUrl, set: setTeamsUrl },
          { id: "slack", name: "Slack", icon: "💬", desc: "Post results to Slack channel", val: webhookUrl, set: setWebhookUrl },
        ].map(w => (
          <div key={w.id} className="cyber-card">
            <div className="flex items-center gap-3 mb-3"><span className="text-xl">{w.icon}</span><div><p className="text-white text-sm font-semibold">{w.name}</p><p className="text-gray-500 text-xs">{w.desc}</p></div></div>
            <input className="cyber-input w-full text-xs font-mono" placeholder="Webhook URL" value={w.val} onChange={e => w.set(e.target.value)} />
            <button className="cyber-btn-primary text-xs mt-2">Save</button>
          </div>
        ))}
      </div>

      {/* Suggest Integration */}
      <div className="cyber-card mt-8 border-dashed border-surface-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div className="flex-1">
            <h3 className="text-white text-sm font-semibold">Missing a tool?</h3>
            <p className="text-gray-500 text-xs mt-1 mb-3">Suggest an integration and we&apos;ll prioritise it based on demand.</p>
            {suggestionSent ? (
              <p className="text-green-400 text-sm">Thanks! We&apos;ll review your suggestion.</p>
            ) : (
              <div className="flex gap-2">
                <input
                  className="cyber-input flex-1 text-sm"
                  placeholder="e.g. Wiz, Rapid7 InsightIDR, SentinelOne..."
                  value={suggestion}
                  onChange={e => setSuggestion(e.target.value)}
                />
                <button
                  onClick={async () => {
                    if (!suggestion.trim()) return;
                    await fetch("/api/support", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ message: "Integration suggestion: " + suggestion }),
                    }).catch(() => {});
                    setSuggestionSent(true);
                    setSuggestion("");
                    setTimeout(() => setSuggestionSent(false), 5000);
                  }}
                  disabled={!suggestion.trim()}
                  className="cyber-btn-primary text-xs disabled:opacity-50"
                >
                  Suggest
                </button>
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
}
