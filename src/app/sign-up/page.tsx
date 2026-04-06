"use client";
import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignUpForm() {
  const searchParams = useSearchParams();
  const invitedEmail = searchParams.get("email") || "";
  const orgName = searchParams.get("org") || "";
  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState(""); const [firstName, setFirstName] = useState(""); const [lastName, setLastName] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, firstName, lastName }) });
    if (!res.ok) { const data = await res.json(); setError(data.error || "Registration failed"); setLoading(false); return; }
    const result = await signIn("credentials", { email: email.toLowerCase(), password, redirect: false });
    if (result?.error) { setError("Account created but sign-in failed. Please sign in manually."); setLoading(false); }
    else { router.push("/portal"); router.refresh(); }
  }

  return (
    <>
      {orgName && (
        <div className="cyber-card border-cyber-600/30 mb-4 text-center">
          <p className="text-gray-400 text-xs">You&apos;ve been invited to</p>
          <p className="text-white text-lg font-display font-bold mt-1">{orgName}</p>
          <p className="text-gray-500 text-xs mt-1">Create your account to join the team</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="cyber-card">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="cyber-label">First Name</label><input className="cyber-input w-full" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nick" autoFocus /></div>
            <div><label className="cyber-label">Last Name</label><input className="cyber-input w-full" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Taylor" /></div>
          </div>
          <div>
            <label className="cyber-label">Work Email</label>
            <input type="email" className="cyber-input w-full" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required
              readOnly={!!invitedEmail} />
            {invitedEmail && <p className="text-gray-600 text-xs mt-1">This email was pre-filled from your invitation</p>}
          </div>
          <div><label className="cyber-label">Password</label><input type="password" className="cyber-input w-full" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 8 characters" required minLength={8} /></div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <p className="text-gray-600 text-xs">By signing up, you agree to our <a href="/terms" className="text-cyber-400 hover:underline" target="_blank">Terms of Service</a> and <a href="/privacy" className="text-cyber-400 hover:underline" target="_blank">Privacy Policy</a>.</p>
            <button type="submit" disabled={loading} className="cyber-btn-primary w-full py-2.5 disabled:opacity-50">{loading ? "Creating account..." : orgName ? `Join ${orgName}` : "Create Account"}</button>
        </div>
      </form>
    </>
  );
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link href="/"><div className="w-10 h-10 rounded-xl bg-cyber-600 flex items-center justify-center mx-auto"><svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg></div></Link>
          <h1 className="font-display text-2xl font-bold text-white mt-4">Create your account</h1>
        </div>
        <Suspense fallback={<div className="cyber-card text-center py-8"><p className="text-gray-500">Loading...</p></div>}><SignUpForm /></Suspense>
        <p className="text-center text-gray-500 text-sm mt-4">Already have an account? <Link href="/sign-in" className="text-cyber-400 hover:text-cyber-300">Sign in</Link></p>
      </div>
    </div>
  );
}
