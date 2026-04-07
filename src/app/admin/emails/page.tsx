import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export default async function EmailsPage() {
  // Ensure table exists
  try {
    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS email_log (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, to_email TEXT NOT NULL, subject TEXT NOT NULL, type TEXT DEFAULT 'transactional', status TEXT DEFAULT 'sent', message_id TEXT, error TEXT, from_address TEXT, created_at TIMESTAMP DEFAULT NOW())`);
  } catch {}

  const emails = await db.$queryRawUnsafe(`SELECT * FROM email_log ORDER BY created_at DESC LIMIT 100`) as any[];

  const total = emails.length;
  const sent = emails.filter((e: any) => e.status === "sent").length;
  const failed = emails.filter((e: any) => e.status === "failed").length;

  // Group by type
  const byType: Record<string, number> = {};
  emails.forEach((e: any) => { byType[e.type || "other"] = (byType[e.type || "other"] || 0) + 1; });

  // Recent failures
  const failures = emails.filter((e: any) => e.status === "failed");

  const tc: Record<string, string> = {
    broadcast: "bg-purple-500/20 text-purple-400",
    invite: "bg-blue-500/20 text-blue-400",
    reset: "bg-yellow-500/20 text-yellow-400",
    duel: "bg-orange-500/20 text-orange-400",
    streak: "bg-red-500/20 text-red-400",
    digest: "bg-cyan-500/20 text-cyan-400",
    challenge: "bg-green-500/20 text-green-400",
    report: "bg-emerald-500/20 text-emerald-400",
    verification: "bg-indigo-500/20 text-indigo-400",
    transactional: "bg-gray-500/20 text-gray-400",
  };

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl font-bold text-white">Email Log</h1><p className="text-gray-500 text-xs mt-1">All emails sent from the platform</p></div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-cyber-400">{sent}</p><p className="text-gray-500 text-xs">Delivered</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-red-400">{failed}</p><p className="text-gray-500 text-xs">Failed</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-white">{total}</p><p className="text-gray-500 text-xs">Total</p></div>
      </div>

      {/* Failures alert */}
      {failures.length > 0 && (
        <div className="cyber-card border-red-500/30 bg-red-500/5 mb-4">
          <h2 className="text-red-400 text-sm font-semibold mb-2">⚠️ Failed Deliveries ({failures.length})</h2>
          <div className="space-y-1">{failures.slice(0, 10).map((f: any) => (
            <div key={f.id} className="flex items-center justify-between py-1.5 border-b border-red-500/10 last:border-0">
              <div><p className="text-white text-xs">{f.to_email}</p><p className="text-gray-500 text-xs truncate max-w-xs">{f.subject}</p></div>
              <div className="text-right"><p className="text-red-400 text-xs">{f.error?.slice(0, 50)}</p><p className="text-gray-600 text-xs">{new Date(f.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p></div>
            </div>
          ))}</div>
        </div>
      )}

      {/* By type */}
      <div className="cyber-card mb-4">
        <h2 className="text-white text-sm font-semibold mb-3">By Type</h2>
        <div className="flex flex-wrap gap-2">{Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
          <span key={type} className={`cyber-badge text-xs ${tc[type] || tc.transactional}`}>{type} <span className="opacity-60 ml-1">×{count}</span></span>
        ))}</div>
      </div>

      {/* Full log */}
      <div className="cyber-card overflow-x-auto">
        <h2 className="text-white text-sm font-semibold mb-3">Recent Emails ({total})</h2>
        <table className="w-full text-xs">
          <thead><tr className="border-b border-surface-3">
            <th className="text-left py-2 text-gray-500 font-normal">Time</th>
            <th className="text-left py-2 text-gray-500 font-normal">To</th>
            <th className="text-left py-2 text-gray-500 font-normal">Subject</th>
            <th className="text-left py-2 text-gray-500 font-normal">Type</th>
            <th className="text-left py-2 text-gray-500 font-normal">Status</th>
          </tr></thead>
          <tbody>{emails.map((e: any) => (
            <tr key={e.id} className={`border-b border-surface-3/30 last:border-0 ${e.status === "failed" ? "bg-red-500/5" : ""}`}>
              <td className="py-2 text-gray-500 whitespace-nowrap">{new Date(e.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
              <td className="py-2 text-white">{e.to_email}</td>
              <td className="py-2 text-gray-400 max-w-48 truncate">{e.subject}</td>
              <td className="py-2"><span className={`cyber-badge text-xs ${tc[e.type] || tc.transactional}`}>{e.type}</span></td>
              <td className="py-2">{e.status === "sent" ? <span className="text-green-400">✓</span> : <span className="text-red-400" title={e.error}>✕</span>}</td>
            </tr>
          ))}</tbody>
        </table>
        {total === 0 && <p className="text-gray-500 text-xs text-center py-8">No emails sent yet</p>}
      </div>
    </div>
  );
}
