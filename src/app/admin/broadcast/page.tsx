"use client";
import { useState, useEffect } from "react";

interface Org { id: string; name: string; slug: string; }
interface Broadcast { id: string; subject: string; audience: string; recipients: number; sent: number; failed: number; created_at: string; }

export default function BroadcastPage() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [orgId, setOrgId] = useState("");
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; recipients: number } | null>(null);
  const [history, setHistory] = useState<Broadcast[]>([]);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    fetch("/api/admin/orgs").then(r => r.ok ? r.json() : []).then(setOrgs);
    fetch("/api/admin/broadcast").then(r => r.ok ? r.json() : []).then(setHistory);
  }, []);

  async function send() {
    if (!subject || !body) return;
    if (!confirm(`Send "${subject}" to ${audience === "all" ? "ALL users" : audience === "admins" ? "all portal admins" : "one portal"}?`)) return;
    setSending(true); setResult(null);
    const res = await fetch("/api/admin/broadcast", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body, audience, orgId: audience === "portal" ? orgId : undefined }),
    });
    const data = await res.json();
    setSending(false);
    if (res.ok) {
      setResult(data);
      fetch("/api/admin/broadcast").then(r => r.ok ? r.json() : []).then(setHistory);
    } else {
      alert(data.error || "Failed to send");
    }
  }

  const templates = [
    { name: "New Feature", subject: "🚀 New on ThreatCast: Head-to-Head Duels!", body: `<h2 style="color:#fff;">⚔️ New Feature: Head-to-Head Duels</h2><p style="color:#ccc;">Hey {{name}},</p><p style="color:#aaa;">Challenge your teammates to a 5-question rapid-fire battle. Same questions, 75-second timer, winner takes the glory.</p><p style="color:#aaa;">Create a duel now and see who's the sharpest on your team.</p>` },
    { name: "Weekly Reminder", subject: "🏅 This week's challenge is waiting for you", body: `<p style="color:#ccc;">Hey {{name}},</p><p style="color:#aaa;">The weekly challenge is live! Compete against everyone on the platform and see if you can crack the top 3.</p><p style="color:#aaa;">It only takes 10 minutes. Your team is counting on you.</p>` },
    { name: "Platform Update", subject: "📣 ThreatCast Update — What's New", body: `<h2 style="color:#fff;">What's New on ThreatCast</h2><p style="color:#ccc;">Hey {{name}},</p><p style="color:#aaa;">We've been busy building. Here's what's new:</p><ul style="color:#aaa;"><li>⚔️ <strong>Head-to-Head Duels</strong> — challenge a teammate</li><li>🧠 <strong>Adaptive Difficulty</strong> — daily drills target your weak spots</li><li>📰 <strong>Real Incident Cards</strong> — learn from MGM, SolarWinds, Colonial Pipeline</li><li>📆 <strong>Training Campaigns</strong> — 12-month themed calendar</li></ul>` },
    { name: "Onboarding Nudge", subject: "👋 Getting started with ThreatCast", body: `<p style="color:#ccc;">Hey {{name}},</p><p style="color:#aaa;">Welcome to ThreatCast! Here's how to get the most out of it:</p><ol style="color:#aaa;"><li><strong>Daily Drill</strong> — 3 questions, 2 minutes. Do one now.</li><li><strong>Weekly Challenge</strong> — compete across the platform every Monday</li><li><strong>Duels</strong> — challenge a teammate to a head-to-head battle</li><li><strong>Full Exercises</strong> — 10-question deep-dive scenarios</li></ol><p style="color:#aaa;">Start with the Daily Drill — it takes less time than making a coffee.</p>` },
  ];

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl font-bold text-white">Broadcast Email</h1><p className="text-gray-500 text-xs mt-1">Send emails to all users about new features and updates</p></div>

      {/* Templates */}
      <div className="cyber-card mb-4">
        <h2 className="text-white text-sm font-semibold mb-3">Quick Templates</h2>
        <div className="flex flex-wrap gap-2">{templates.map(t => (
          <button key={t.name} onClick={() => { setSubject(t.subject); setBody(t.body); }} className="cyber-btn-secondary text-xs">{t.name}</button>
        ))}</div>
      </div>

      {/* Compose */}
      <div className="cyber-card mb-4 border-cyber-600/20">
        <h2 className="text-white text-sm font-semibold mb-3">Compose</h2>

        <div className="mb-3">
          <label className="cyber-label">Audience</label>
          <div className="flex gap-2 flex-wrap">{[
            { value: "all", label: "All Users" },
            { value: "admins", label: "Portal Admins Only" },
            { value: "portal", label: "Specific Portal" },
          ].map(a => (
            <button key={a.value} onClick={() => setAudience(a.value)}
              className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${audience === a.value ? "border-cyber-500 bg-cyber-500/10 text-cyber-400" : "border-surface-3 text-gray-500"}`}>
              {a.label}
            </button>
          ))}</div>
          {audience === "portal" && (
            <select className="cyber-input w-full mt-2 text-sm" value={orgId} onChange={e => setOrgId(e.target.value)}>
              <option value="">Select portal...</option>
              {orgs.map(o => <option key={o.id} value={o.id}>{o.name} ({o.slug})</option>)}
            </select>
          )}
        </div>

        <div className="mb-3">
          <label className="cyber-label">Subject</label>
          <input className="cyber-input w-full" value={subject} onChange={e => setSubject(e.target.value)} placeholder="🚀 New on ThreatCast: ..." />
        </div>

        <div className="mb-3">
          <label className="cyber-label">Body (HTML — use {"{{name}}"} for personalisation)</label>
          <textarea className="cyber-input w-full h-40 font-mono text-xs" value={body} onChange={e => setBody(e.target.value)} placeholder='<h2 style="color:#fff;">What&apos;s New</h2><p style="color:#aaa;">Hey {{name}}, ...</p>' />
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setPreview(!preview)} className="cyber-btn-secondary text-sm">{preview ? "Hide Preview" : "Preview"}</button>
          <button onClick={send} disabled={sending || !subject || !body || (audience === "portal" && !orgId)} className="cyber-btn-primary text-sm disabled:opacity-50">
            {sending ? "Sending..." : "Send Broadcast"}
          </button>
        </div>

        {result && (
          <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-green-400 text-sm font-semibold">Sent! {result.sent}/{result.recipients} delivered{result.failed > 0 ? `, ${result.failed} failed` : ""}</p>
          </div>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div className="cyber-card mb-4 border-purple-500/20">
          <h2 className="text-purple-400 text-sm font-semibold mb-3">Preview</h2>
          <div className="bg-white rounded-lg p-4 max-w-lg">
            <div style={{ fontFamily: "-apple-system, sans-serif", maxWidth: 600, margin: "0 auto" }}>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Threat<span style={{ color: "#14b89a" }}>Cast</span></div>
              <div dangerouslySetInnerHTML={{ __html: body.replace(/\{\{name\}\}/g, "Nick") }} />
              <div style={{ marginTop: 24, paddingTop: 12, borderTop: "1px solid #eee" }}>
                <span style={{ display: "inline-block", background: "#14b89a", color: "white", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>Open ThreatCast →</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="cyber-card">
          <h2 className="text-white text-sm font-semibold mb-3">Send History</h2>
          <div className="space-y-2">{history.map((b: any) => (
            <div key={b.id} className="flex items-center justify-between py-2 border-b border-surface-3/30 last:border-0">
              <div>
                <p className="text-white text-xs">{b.subject}</p>
                <p className="text-gray-600 text-xs">{b.audience} · {new Date(b.created_at).toLocaleDateString("en-GB")}</p>
              </div>
              <div className="text-right">
                <p className="text-green-400 text-xs">{b.sent}/{b.recipients} sent</p>
                {b.failed > 0 && <p className="text-red-400 text-xs">{b.failed} failed</p>}
              </div>
            </div>
          ))}</div>
        </div>
      )}
    </div>
  );
}
