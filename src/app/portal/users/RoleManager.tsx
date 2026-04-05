"use client";
import { useState } from "react";

export default function RoleManager({ userId, currentRole, userName }: { userId: string; currentRole: string; userName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function changeRole(newRole: string) {
    setLoading(true);
    await fetch("/api/portal/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    setLoading(false); setOpen(false);
    window.location.reload();
  }

  async function removeUser() {
    if (!confirm(`Remove ${userName.trim() || "this user"} from the portal?`)) return;
    setLoading(true);
    await fetch(`/api/portal/users?userId=${userId}`, { method: "DELETE" });
    setLoading(false);
    window.location.reload();
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-1.5 rounded hover:bg-surface-2 text-gray-500 hover:text-gray-300 transition-colors" disabled={loading}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>
      </button>
      {open && <>
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
        <div className="absolute right-0 top-8 z-50 w-44 bg-surface-1 border border-surface-3 rounded-lg shadow-xl overflow-hidden">
          {currentRole === "MEMBER" ? (
            <button onClick={() => changeRole("CLIENT_ADMIN")} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-surface-2">Promote to Admin</button>
          ) : (
            <button onClick={() => changeRole("MEMBER")} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-surface-2">Demote to Participant</button>
          )}
          <button onClick={removeUser} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 border-t border-surface-3">Remove from Portal</button>
        </div>
      </>}
    </div>
  );
}
