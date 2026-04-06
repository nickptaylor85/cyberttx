"use client";
import { useState } from "react";

export default function IntegrationsPage() {
  const [webhookUrl, setWebhookUrl] = useState(""); const [teamsUrl, setTeamsUrl] = useState("");
  const [saved, setSaved] = useState(""); const [tested, setTested] = useState("");

  async function saveWebhook(type: string, url: string) {
    setSaved(type); setTimeout(() => setSaved(""), 3000);
  }

  async function testWebhook(type: string, url: string) {
    if (!url) return;
    setTested(type);
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "test",
          message: "ThreatCast integration test",
          timestamp: new Date().toISOString(),
          data: { exercise: "Test Exercise", theme: "ransomware", score: 85 },
        }),
      });
    } catch {}
    setTimeout(() => setTested(""), 3000);
  }

  const integrations = [
    { id: "teams", name: "Microsoft Teams", icon: "💬", desc: "Post exercise results and alerts to a Teams channel", fields: [
      { label: "Incoming Webhook URL", placeholder: "https://outlook.office.com/webhook/xxx", value: teamsUrl, onChange: setTeamsUrl },
    ], events: "Exercise completed, low accuracy alerts, new team members" },
    { id: "slack", name: "Slack", icon: "💬", desc: "Post exercise results and alerts to a Slack channel", fields: [
      { label: "Webhook URL", placeholder: "https://hooks.slack.com/services/xxx", value: webhookUrl, onChange: setWebhookUrl },
    ], events: "Exercise completed, low accuracy alerts, new team members" },
    { id: "splunk", name: "Splunk SIEM", icon: "🔍", desc: "Forward exercise events as structured logs", fields: [
      { label: "HEC URL", placeholder: "https://splunk.company.com:8088/services/collector" },
    ], events: "All exercise events as CIM-compliant JSON" },
    { id: "sentinel", name: "Microsoft Sentinel", icon: "🛡️", desc: "Send exercise data to Log Analytics workspace", fields: [
      { label: "Workspace ID", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
      { label: "Shared Key", placeholder: "Base64 encoded key" },
    ], events: "Exercise events as custom log type" },
    { id: "servicenow", name: "ServiceNow", icon: "📋", desc: "Create incident records from exercise scenarios", fields: [
      { label: "Instance URL", placeholder: "https://company.service-now.com" },
    ], events: "Exercise completion creates learning incident" },
    { id: "jira", name: "Jira", icon: "📌", desc: "Create improvement tasks from exercise gaps", fields: [
      { label: "API Token", placeholder: "Jira API token" },
      { label: "Project Key", placeholder: "SEC" },
    ], events: "Low-scoring areas create improvement tickets" },
  ];

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Integrations</h1><p className="text-gray-500 text-xs mt-1">Connect ThreatCast to your existing tools</p></div>
      <div className="space-y-4">{integrations.map(int => (
        <div key={int.id} className="cyber-card">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl">{int.icon}</span>
            <div className="flex-1">
              <p className="text-white text-sm font-semibold">{int.name}</p>
              <p className="text-gray-500 text-xs mt-0.5">{int.desc}</p>
              <p className="text-gray-600 text-xs mt-1">Events: {int.events}</p>
            </div>
          </div>
          <div className="space-y-2">
            {int.fields.map((f, i) => (
              <div key={i}><label className="cyber-label">{f.label}</label><input className="cyber-input w-full text-xs font-mono" placeholder={f.placeholder} value={(f as any).value || ""} onChange={e => (f as any).onChange?.(e.target.value)} /></div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => saveWebhook(int.id, "")} className="cyber-btn-primary text-xs">{saved === int.id ? "✓ Saved" : "Save"}</button>
            {int.id === "teams" && teamsUrl && <button onClick={() => testWebhook("teams", teamsUrl)} className="cyber-btn-secondary text-xs">{tested === "teams" ? "✓ Sent" : "Test"}</button>}
            {int.id === "slack" && webhookUrl && <button onClick={() => testWebhook("slack", webhookUrl)} className="cyber-btn-secondary text-xs">{tested === "slack" ? "✓ Sent" : "Test"}</button>}
          </div>
        </div>
      ))}</div>
    </div>
  );
}
