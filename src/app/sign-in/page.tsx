"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/portal";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);

    const result = await signIn("credentials", {
      email: email.toLowerCase(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-cyber-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
            </div>
          </Link>
          <h1 className="font-display text-2xl font-bold text-white mt-4">Sign in to ThreatCast</h1>
          <p className="text-gray-500 text-sm mt-2">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="cyber-card">
          <div className="space-y-4">
            <div>
              <label className="cyber-label">Email</label>
              <input type="email" className="cyber-input w-full" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required autoFocus />
            </div>
            <div>
              <label className="cyber-label">Password</label>
              <input type="password" className="cyber-input w-full" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="cyber-btn-primary w-full py-2.5 disabled:opacity-50">{loading ? "Signing in..." : "Sign In"}</button>
          </div>
        </form>

        <p className="text-center text-gray-500 text-sm mt-4">Don&apos;t have an account? <Link href="/sign-up" className="text-cyber-400 hover:text-cyber-300">Create one</Link></p>
      </div>
    </div>
  );
}
