"use client";
import { useState } from "react";

export default function IntegrationsPage() {
  const [webhook, setWebhook] = useState("");
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);

  async function saveWebhook() {
    // Save webhook URL (would persist to DB in production)
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function testWebhook() {
    if (!webhook) return;
    setTesting(true);
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "exercise.completed",
          timestamp: new Date().toISOString(),
          data: { title: "Test Exercise", accuracy: 75, participants: 5, theme: "ransomware" },
          source: "threatcast",
        }),
      });
    } catch {}
    setTesting(false);
  }

  const integrations = [
    { name: "Splunk", desc: "Send exercise results to Splunk via HEC", icon: "🔍", status: "available" },
    { name: "Microsoft Sentinel", desc: "Log exercise events to Sentinel workspace", icon: "🛡️", status: "available" },
    { name: "ServiceNow", desc: "Create IR tickets from exercise findings", icon: "📋", status: "available" },
    { name: "Jira", desc: "Create remediation tasks from gaps identified", icon: "📝", status: "coming" },
    { name: "Slack", desc: "Post exercise results and alerts to channels", icon: "💬", status: "coming" },
    { name: "Teams", desc: "Post results to Microsoft Teams channels", icon: "👥", status: "coming" },
  ];

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Integrations</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">Connect ThreatCast to your security stack</p></div>

      {/* Webhook */}
      <div className="cyber-card mb-6">
        <h2 className="font-display text-base font-semibold text-white mb-3">Webhook (POST)</h2>
        <p className="text-gray-400 text-xs mb-3">Receive real-time events when exercises are completed. Works with any SIEM, SOAR, or automation platform.</p>
        <div className="flex gap-2 mb-2">
          <input className="cyber-input flex-1 font-mono text-xs" placeholder="https://your-siem.com/api/webhook" value={webhook} onChange={e => setWebhook(e.target.value)} />
          <button onClick={saveWebhook} className="cyber-btn-primary text-xs whitespace-nowrap">Save</button>
        </div>
        {webhook && <button onClick={testWebhook} disabled={testing} className="cyber-btn-secondary text-xs">{testing ? "Sending..." : "Send Test Event"}</button>}
        {saved && <p className="text-green-400 text-xs mt-2">Webhook saved</p>}
        <div className="mt-3 p-3 bg-surface-0 rounded-lg">
          <p className="text-gray-500 text-xs font-semibold mb-1">Events sent:</p>
          <div className="text-gray-600 text-xs font-mono space-y-0.5">
            <p>exercise.completed — When a TTX finishes</p>
            <p>exercise.created — When a TTX is generated</p>
            <p>user.joined — When a team member joins</p>
            <p>compliance.gap — When a framework gap is detected</p>
          </div>
        </div>
      </div>

      {/* Platform integrations */}
      <div className="cyber-card">
        <h2 className="font-display text-base font-semibold text-white mb-4">Platform Integrations</h2>
        <div className="space-y-3">{integrations.map(i => (
          <div key={i.name} className="flex items-center justify-between py-2 border-b border-surface-3/50 last:border-0">
            <div className="flex items-center gap-3">
              <span className="text-xl">{i.icon}</span>
              <div><p className="text-white text-sm">{i.name}</p><p className="text-gray-500 text-xs">{i.desc}</p></div>
            </div>
            {i.status === "available" ? (
              <button className="cyber-btn-secondary text-xs py-1.5 px-3">Configure</button>
            ) : (
              <span className="text-gray-600 text-xs">Coming soon</span>
            )}
          </div>
        ))}</div>
      </div>
    </div>
  );
}
