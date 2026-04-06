"use client";
import { useState, useEffect } from "react";

interface Org { id: string; name: string; slug: string; }

export default function ReportsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [sending, setSending] = useState("");

  useEffect(() => { fetch("/api/admin/orgs").then(r => r.ok ? r.json() : []).then(setOrgs); }, []);

  async function sendNow(orgId: string) {
    setSending(orgId);
    // Trigger report for a single org (future: add orgId filter to cron endpoint)
    await fetch("/api/cron/weekly-report", { headers: { Authorization: `Bearer ${prompt("Enter CRON_SECRET to send report:")}` } });
    setSending(""); alert("Reports sent to all eligible portals");
  }

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl font-bold text-white">Scheduled Reports</h1><p className="text-gray-500 text-xs mt-1">Automated weekly email digests sent every Monday 9am</p></div>

      <div className="cyber-card mb-4">
        <h2 className="text-white text-sm font-semibold mb-3">Report Schedule</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 border-b border-surface-3/30">
            <div><p className="text-white text-sm">Weekly Digest</p><p className="text-gray-500 text-xs">Every Monday at 9:00 AM GMT</p></div>
            <span className="cyber-badge text-xs bg-green-500/20 text-green-400">Active</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div><p className="text-white text-sm">Monthly Summary</p><p className="text-gray-500 text-xs">1st of each month</p></div>
            <span className="cyber-badge text-xs bg-gray-500/20 text-gray-400">Coming Soon</span>
          </div>
        </div>
      </div>

      <div className="cyber-card mb-4">
        <h2 className="text-white text-sm font-semibold mb-3">Report Contents</h2>
        <div className="text-gray-400 text-xs space-y-1">
          <p>Each weekly report includes:</p>
          <p>• Exercises completed this week</p>
          <p>• Average accuracy across all participants</p>
          <p>• Number of active users</p>
          <p>• Total exercises to date</p>
          <p>• Direct link to dashboard</p>
        </div>
      </div>

      <div className="cyber-card">
        <h2 className="text-white text-sm font-semibold mb-3">Recipient Portals</h2>
        <p className="text-gray-500 text-xs mb-3">Reports are sent to Portal Admin emails. Portals with no activity for the week are skipped (except first Monday of the month).</p>
        {orgs.length === 0 ? <p className="text-gray-500 text-xs">No portals found</p> :
          <div className="space-y-1">{orgs.map(o => (
            <div key={o.id} className="flex items-center justify-between py-1.5 border-b border-surface-3/30 last:border-0">
              <p className="text-white text-xs">{o.name} <span className="text-gray-600">({o.slug})</span></p>
              <span className="cyber-badge text-xs bg-green-500/10 text-green-400">Enrolled</span>
            </div>
          ))}</div>
        }
      </div>
    </div>
  );
}
