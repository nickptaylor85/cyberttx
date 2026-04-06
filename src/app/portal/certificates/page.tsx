"use client";
import { useState, useEffect } from "react";

interface Cert { id: string; session_id: string; title: string; grade: string; accuracy: number; theme: string; org_name: string; earned_at: string; expires_at: string; }

export default function CertificatesPage() {
  const [certs, setCerts] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/certificates").then(r => r.ok ? r.json() : []).then(setCerts).finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const active = certs.filter(c => new Date(c.expires_at) > now);
  const expired = certs.filter(c => new Date(c.expires_at) <= now);

  const gc: Record<string, string> = { PLATINUM: "bg-purple-500/20 text-purple-400 border-purple-500/30", GOLD: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", SILVER: "bg-gray-500/20 text-gray-300 border-gray-500/30", BRONZE: "bg-orange-500/20 text-orange-400 border-orange-500/30" };

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">My Certificates</h1><p className="text-gray-500 text-xs mt-1">{active.length} active · {expired.length} expired · Certificates valid for 1 year</p></div>

      {loading ? <p className="text-gray-500 text-center py-8">Loading...</p> :
        certs.length === 0 ? (
          <div className="cyber-card text-center py-12">
            <p className="text-3xl mb-3">🏆</p>
            <p className="text-gray-400 text-sm">No certificates yet</p>
            <p className="text-gray-500 text-xs mt-1">Complete exercises and download your certificate to earn them</p>
          </div>
        ) : <>
          {active.length > 0 && (
            <div className="mb-6">
              <h2 className="text-green-400 text-xs font-semibold mb-2">Active ({active.length})</h2>
              <div className="grid sm:grid-cols-2 gap-3">{active.map(c => (
                <div key={c.id} className="cyber-card border-green-500/20">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white text-sm font-semibold">{c.title}</p>
                      <p className="text-gray-500 text-xs">{c.theme} · {c.org_name}</p>
                    </div>
                    <span className={`cyber-badge text-xs border ${gc[c.grade] || gc.BRONZE}`}>{c.grade}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-gray-500 text-xs">
                      <span>Earned: {new Date(c.earned_at).toLocaleDateString("en-GB")}</span>
                      <span className="ml-2">Expires: {new Date(c.expires_at).toLocaleDateString("en-GB")}</span>
                    </div>
                    <span className="text-cyber-400 font-mono text-sm font-bold">{c.accuracy}%</span>
                  </div>
                  <a href={`/api/portal/certificate/pdf?sessionId=${c.session_id}`} className="cyber-btn-secondary text-xs mt-2 inline-block">📄 Download PDF</a>
                </div>
              ))}</div>
            </div>
          )}

          {expired.length > 0 && (
            <div>
              <h2 className="text-red-400 text-xs font-semibold mb-2">Expired ({expired.length})</h2>
              <div className="grid sm:grid-cols-2 gap-3">{expired.map(c => (
                <div key={c.id} className="cyber-card opacity-60">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white text-sm font-semibold">{c.title}</p>
                      <p className="text-gray-500 text-xs">{c.theme} · {c.org_name}</p>
                    </div>
                    <span className="cyber-badge text-xs bg-red-500/20 text-red-400">EXPIRED</span>
                  </div>
                  <p className="text-gray-600 text-xs">Expired: {new Date(c.expires_at).toLocaleDateString("en-GB")} · Was: {c.grade} ({c.accuracy}%)</p>
                  <p className="text-gray-600 text-xs mt-1">Complete the exercise again to earn a new certificate</p>
                </div>
              ))}</div>
            </div>
          )}
        </>
      }
    </div>
  );
}
