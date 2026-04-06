"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const email = params.get("email") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (password !== confirm) { setError("Passwords don't match"); return; }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email, password }),
    });
    setLoading(false);
    if (res.ok) setDone(true);
    else { const d = await res.json(); setError(d.error || "Failed to reset password"); }
  }

  if (!token || !email) return <div className="cyber-card text-center py-8"><p className="text-red-400 text-sm">Invalid reset link</p><Link href="/forgot-password" className="text-cyber-400 text-sm mt-4 inline-block">Request a new one</Link></div>;

  if (done) return (
    <div className="cyber-card text-center py-8">
      <p className="text-3xl mb-3">✅</p>
      <p className="text-green-400 text-sm font-semibold">Password reset successfully!</p>
      <Link href="/sign-in" className="cyber-btn-primary text-sm mt-4 inline-block">Sign In →</Link>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="cyber-card space-y-4">
      <p className="text-gray-500 text-xs">Resetting password for {email}</p>
      <div><label className="cyber-label">New Password</label><input type="password" className="cyber-input w-full" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required autoFocus /></div>
      <div><label className="cyber-label">Confirm Password</label><input type="password" className="cyber-input w-full" value={confirm} onChange={e => setConfirm(e.target.value)} minLength={8} required /></div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button type="submit" disabled={loading} className="cyber-btn-primary w-full py-2.5 disabled:opacity-50">{loading ? "Resetting..." : "Set New Password"}</button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8"><h1 className="font-display text-2xl font-bold text-white">Set New Password</h1></div>
        <Suspense fallback={<div className="cyber-card text-center py-8"><p className="text-gray-500">Loading...</p></div>}><ResetForm /></Suspense>
      </div>
    </div>
  );
}
