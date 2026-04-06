"use client";
import { useState } from "react";

interface Props {
  userId: string; userName: string; userEmail: string;
  currentRole: string; currentOrgId: string | null;
  isActive: boolean; orgs: { id: string; name: string }[];
  isPending?: boolean;
}

export default function AdminUserActions({ userId, userName, userEmail, currentRole, currentOrgId, isActive, orgs, isPending }: Props) {
  const [open, setOpen] = useState(false);
  const [showResetPw, setShowResetPw] = useState(false);
  const [showChangeOrg, setShowChangeOrg] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [tempPw, setTempPw] = useState("");
  const [loading, setLoading] = useState(false);

  async function action(actionName: string, value?: string) {
    setLoading(true);
    await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: actionName, value }),
    });
    setLoading(false); setOpen(false);
    window.location.reload();
  }

  async function resetPassword() {
    setLoading(true);
    const pw = newPassword || "ThreatCast2026!";
    const res = await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "reset_password", value: pw }),
    });
    const data = await res.json();
    setTempPw(data.tempPassword || pw);
    setLoading(false); setShowResetPw(false);
  }

  async function deleteUser() {
    if (!confirm(`Permanently delete ${userName}? This removes all their exercise data and cannot be undone.`)) return;
    setLoading(true);
    await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
    setLoading(false);
    window.location.reload();
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} disabled={loading} className="p-1.5 rounded hover:bg-surface-2 text-gray-500 hover:text-gray-300 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>
      </button>
      {open && <>
        <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setShowResetPw(false); setShowChangeOrg(false); setTempPw(""); }} />
        <div className="absolute right-0 top-8 z-50 w-56 bg-surface-1 border border-surface-3 rounded-lg shadow-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-surface-3">
            <p className="text-white text-xs font-semibold truncate">{userName}</p>
            <p className="text-gray-500 text-xs truncate">{userEmail}</p>
          </div>

          {/* Password reset */}
          {!isPending && !showResetPw && !showChangeOrg && !tempPw && (
            <button onClick={() => setShowResetPw(true)} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-surface-2">Reset Password</button>
          )}
          {showResetPw && (
            <div className="px-3 py-2 space-y-2">
              <input type="text" className="cyber-input w-full text-xs" placeholder="New password (default: ThreatCast2026!)" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <button onClick={resetPassword} disabled={loading} className="cyber-btn-primary text-xs w-full disabled:opacity-50">{loading ? "Resetting..." : "Reset"}</button>
            </div>
          )}
          {tempPw && (
            <div className="px-3 py-2">
              <p className="text-green-400 text-xs mb-1">Password reset!</p>
              <p className="text-xs font-mono bg-surface-0 p-1.5 rounded text-cyber-400 select-all break-all">{tempPw}</p>
              <p className="text-gray-600 text-xs mt-1">Share this with the user securely</p>
            </div>
          )}

          {/* Role management */}
          {!isPending && !showResetPw && !showChangeOrg && !tempPw && <>
            {currentRole !== "SUPER_ADMIN" && (
              <button onClick={() => action("change_role", "SUPER_ADMIN")} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-surface-2">Promote to Super Admin</button>
            )}
            {currentRole !== "CLIENT_ADMIN" && (
              <button onClick={() => action("change_role", "CLIENT_ADMIN")} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-surface-2">Set as Portal Admin</button>
            )}
            {currentRole !== "MEMBER" && (
              <button onClick={() => action("change_role", "MEMBER")} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-surface-2">Set as Participant</button>
            )}
          </>}

          {/* Change org */}
          {!showResetPw && !tempPw && !showChangeOrg && (
            <button onClick={() => setShowChangeOrg(true)} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-surface-2">Move to Portal...</button>
          )}
          {showChangeOrg && (
            <div className="px-3 py-2 max-h-40 overflow-y-auto space-y-1">
              <p className="text-gray-500 text-xs font-semibold mb-1">Select portal:</p>
              <button onClick={() => action("change_org", "")} className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-surface-2 ${!currentOrgId ? "text-cyber-400" : "text-gray-400"}`}>None (unlinked)</button>
              {orgs.map(o => (
                <button key={o.id} onClick={() => action("change_org", o.id)} className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-surface-2 ${currentOrgId === o.id ? "text-cyber-400" : "text-gray-400"}`}>
                  {o.name} {currentOrgId === o.id && "✓"}
                </button>
              ))}
            </div>
          )}

          {/* Toggle active */}
          {!isPending && !showResetPw && !showChangeOrg && !tempPw && (
            <button onClick={() => action("toggle_active")} className="w-full text-left px-3 py-2 text-sm text-yellow-400 hover:bg-yellow-500/10 border-t border-surface-3">
              {isActive ? "Disable Account" : "Enable Account"}
            </button>
          )}

          {/* Delete */}
          {!showResetPw && !showChangeOrg && !tempPw && (
            <button onClick={deleteUser} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 border-t border-surface-3">Delete User</button>
          )}
        </div>
      </>}
    </div>
  );
}
