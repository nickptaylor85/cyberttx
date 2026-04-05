"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(""); const [sent, setSent] = useState(false); const [loading, setLoading] = useState(false);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    setSent(true); setLoading(false);
  }
  return (
    <div className="min-h-screen flex items-center justify-center px-4"><div className="w-full max-w-sm">
      <div className="text-center mb-8"><Link href="/"><div className="w-10 h-10 rounded-xl bg-cyber-600 flex items-center justify-center mx-auto"><svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg></div></Link>
        <h1 className="font-display text-2xl font-bold text-white mt-4">Reset your password</h1></div>
      {sent ? (
        <div className="cyber-card text-center"><p className="text-green-400 text-sm mb-2">Check your email</p><p className="text-gray-400 text-xs">If an account exists for {email}, we&apos;ve sent a reset link.</p><Link href="/sign-in" className="text-cyber-400 text-sm mt-4 inline-block">← Back to sign in</Link></div>
      ) : (
        <form onSubmit={handleSubmit} className="cyber-card"><div className="space-y-4"><div><label className="cyber-label">Email</label><input type="email" className="cyber-input w-full" value={email} onChange={e => setEmail(e.target.value)} required autoFocus /></div>
          <button type="submit" disabled={loading} className="cyber-btn-primary w-full py-2.5 disabled:opacity-50">{loading ? "Sending..." : "Send Reset Link"}</button></div></form>
      )}
      <p className="text-center text-gray-500 text-sm mt-4"><Link href="/sign-in" className="text-cyber-400">← Back to sign in</Link></p>
    </div></div>
  );
}
