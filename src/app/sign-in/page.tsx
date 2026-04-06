"use client";
import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/portal";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);

    // Step 1: Check if MFA is required
    if (!mfaRequired) {
      const mfaCheck = await fetch("/api/auth/mfa/check", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase() }),
      }).then(r => r.json());

      if (mfaCheck.mfaRequired) {
        setMfaRequired(true); setLoading(false);
        return;
      }
    }

    // Step 2: If MFA required, verify code first
    if (mfaRequired && mfaCode) {
      const verify = await fetch("/api/auth/mfa/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase(), password, code: mfaCode }),
      }).then(r => r.json());

      if (!verify.success) {
        setError(verify.error || "Invalid MFA code");
        setLoading(false); return;
      }
    }

    // Step 3: Sign in with NextAuth
    const result = await signIn("credentials", { email: email.toLowerCase(), password, redirect: false });
    if (result?.error) { setError("Invalid email or password"); setLoading(false); }
    else {
      // Check user role to determine redirect
      const me = await fetch("/api/portal/me").then(r => r.ok ? r.json() : null).catch(() => null);
      if (me?.role === "SUPER_ADMIN") {
        router.push("/admin");
      } else if (callbackUrl === "/admin") {
        // Non-admin tried to access admin — send to portal instead
        router.push("/portal");
      } else {
        router.push(callbackUrl || "/portal");
      }
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="cyber-card">
      <div className="space-y-4">
        <div><label className="cyber-label">Email</label><input type="email" className="cyber-input w-full" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required autoFocus disabled={mfaRequired} /></div>
        <div><label className="cyber-label">Password</label><input type="password" className="cyber-input w-full" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} disabled={mfaRequired} /></div>
        {mfaRequired && (
          <div className="border-t border-surface-3 pt-4">
            <div className="flex items-center gap-2 mb-3"><span className="text-lg">🔐</span><p className="text-white text-sm font-medium">Two-Factor Authentication</p></div>
            <label className="cyber-label">Enter the 6-digit code from your authenticator app</label>
            <input type="text" className="cyber-input w-full text-center font-mono text-lg tracking-widest" value={mfaCode} onChange={e => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6} autoFocus autoComplete="one-time-code" />
          </div>
        )}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading || (mfaRequired && mfaCode.length < 6)} className="cyber-btn-primary w-full py-2.5 disabled:opacity-50">
          {loading ? "Signing in..." : mfaRequired ? "Verify & Sign In" : "Sign In"}
        </button>
        {mfaRequired && <button type="button" onClick={() => { setMfaRequired(false); setMfaCode(""); }} className="text-gray-500 text-xs hover:text-gray-300 w-full text-center">← Back to credentials</button>}
      </div>
    </form>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex"><div className="w-10 h-10 rounded-xl bg-cyber-600 flex items-center justify-center"><svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg></div></Link>
          <h1 className="font-display text-2xl font-bold text-white mt-4">Sign in to ThreatCast</h1>
        </div>
        <Suspense fallback={<div className="cyber-card text-center py-8"><p className="text-gray-500">Loading...</p></div>}><SignInForm /></Suspense>
        <p className="text-center text-gray-500 text-sm mt-4"><a href="/forgot-password" className="text-gray-500 hover:text-gray-300">Forgot password?</a> · Don&apos;t have an account? <Link href="/sign-up" className="text-cyber-400 hover:text-cyber-300">Create one</Link></p>
      </div>
    </div>
  );
}
