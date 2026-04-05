"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetForm() {
  const params = useSearchParams();
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(""); const [success, setSuccess] = useState(false); const [loading, setLoading] = useState(false);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: params.get("email"), token: params.get("token"), password }) });
    const data = await res.json();
    if (data.success) setSuccess(true); else { setError(data.error || "Reset failed"); setLoading(false); }
  }
  if (success) return <div className="cyber-card text-center"><p className="text-green-400 text-sm mb-2">Password reset!</p><Link href="/sign-in" className="cyber-btn-primary text-sm inline-block mt-2">Sign In →</Link></div>;
  return (
    <form onSubmit={handleSubmit} className="cyber-card"><div className="space-y-4">
      <div><label className="cyber-label">New Password</label><input type="password" className="cyber-input w-full" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} /></div>
      <div><label className="cyber-label">Confirm Password</label><input type="password" className="cyber-input w-full" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={8} /></div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button type="submit" disabled={loading} className="cyber-btn-primary w-full py-2.5 disabled:opacity-50">{loading ? "Resetting..." : "Set New Password"}</button>
    </div></form>
  );
}
export default function ResetPasswordPage() {
  return (<div className="min-h-screen flex items-center justify-center px-4"><div className="w-full max-w-sm">
    <div className="text-center mb-8"><h1 className="font-display text-2xl font-bold text-white">Set new password</h1></div>
    <Suspense fallback={<div className="cyber-card text-center py-8"><p className="text-gray-500">Loading...</p></div>}><ResetForm /></Suspense>
  </div></div>);
}
