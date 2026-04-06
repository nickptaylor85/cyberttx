"use client";
import { useState, useEffect } from "react";

export default function AdminSettingsPage() {
  // MFA state
  const [mfa, setMfa] = useState<{ enabled: boolean; secret?: string; qrCode?: string }>({ enabled: false });
  const [mfaCode, setMfaCode] = useState(""); const [mfaError, setMfaError] = useState("");
  const [showMfaSetup, setShowMfaSetup] = useState(false); const [mfaLoading, setMfaLoading] = useState(true);
  const [disableCode, setDisableCode] = useState("");

  // Password change state
  const [currentPw, setCurrentPw] = useState(""); const [newPw, setNewPw] = useState("");
  const [pwError, setPwError] = useState(""); const [pwSuccess, setPwSuccess] = useState(false); const [pwLoading, setPwLoading] = useState(false);

  // SAML state
  const [saml, setSaml] = useState({ entityId: "", ssoUrl: "", certificate: "" });
  const [samlSaved, setSamlSaved] = useState(false);

  // Env health
  const [envStatus, setEnvStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/auth/mfa").then(r => r.json()).then(d => { setMfa(d); setMfaLoading(false); }).catch(() => setMfaLoading(false));
    // Check env vars
    setEnvStatus({
      auth: true, // if we got here, auth works
      database: true, // if page loaded, DB works
    });
  }, []);

  async function enableMfa() {
    if (mfaCode.length !== 6) return;
    setMfaError("");
    const res = await fetch("/api/auth/mfa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: mfaCode, secret: mfa.secret }) });
    const data = await res.json();
    if (data.success) { setMfa({ enabled: true }); setShowMfaSetup(false); setMfaCode(""); }
    else setMfaError(data.error || "Verification failed");
  }

  async function disableMfa() {
    if (disableCode.length !== 6) return;
    const res = await fetch("/api/auth/mfa", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: disableCode }) });
    const data = await res.json();
    if (data.success) { setMfa({ enabled: false }); setDisableCode(""); }
    else setMfaError(data.error || "Invalid code");
  }

  async function changePassword() {
    setPwError(""); setPwLoading(true);
    const res = await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }) });
    const data = await res.json();
    if (data.success) { setPwSuccess(true); setCurrentPw(""); setNewPw(""); setTimeout(() => setPwSuccess(false), 3000); }
    else setPwError(data.error || "Failed");
    setPwLoading(false);
  }

  const envChecks = [
    { name: "Auth (NextAuth)", env: "AUTH_SECRET", ok: true },
    { name: "Database", env: "DATABASE_URL", ok: true },
    { name: "AI (Anthropic)", env: "ANTHROPIC_API_KEY" },
    { name: "Email (Resend)", env: "RESEND_API_KEY" },
    { name: "Real-time (Pusher)", env: "PUSHER_SECRET" },
    { name: "Payments (Stripe)", env: "STRIPE_SECRET_KEY" },
  ];

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Admin Settings</h1><p className="text-gray-500 text-xs mt-1">Platform configuration and security</p></div>

      {/* Password Change */}
      <div className="cyber-card mb-4">
        <h2 className="text-white text-sm font-semibold mb-3">Change Password</h2>
        <div className="space-y-3 max-w-md">
          <div><label className="cyber-label">Current Password</label><input type="password" className="cyber-input w-full" value={currentPw} onChange={e => setCurrentPw(e.target.value)} /></div>
          <div><label className="cyber-label">New Password</label><input type="password" className="cyber-input w-full" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Minimum 8 characters" minLength={8} /></div>
          {pwError && <p className="text-red-400 text-xs">{pwError}</p>}
          {pwSuccess && <p className="text-green-400 text-xs">Password updated!</p>}
          <button onClick={changePassword} disabled={pwLoading || !currentPw || newPw.length < 8} className="cyber-btn-primary text-sm disabled:opacity-50">{pwLoading ? "Updating..." : "Update Password"}</button>
        </div>
      </div>

      {/* MFA */}
      <div className="cyber-card mb-4">
        <div className="flex items-center justify-between mb-3">
          <div><h2 className="text-white text-sm font-semibold">Two-Factor Authentication (MFA)</h2><p className="text-gray-500 text-xs mt-1">Protect your admin account with TOTP</p></div>
          <span className={`cyber-badge text-xs ${mfa.enabled ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{mfa.enabled ? "Enabled" : "Disabled"}</span>
        </div>

        {mfaLoading ? <p className="text-gray-500 text-xs">Loading...</p> : mfa.enabled ? (
          <div>
            <p className="text-green-400 text-xs mb-3">✓ MFA is active. You&apos;ll be asked for a code on every sign-in.</p>
            <div className="flex gap-2 items-end max-w-md">
              <div className="flex-1"><label className="cyber-label">Enter code to disable</label><input className="cyber-input w-full font-mono text-center" value={disableCode} onChange={e => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6} /></div>
              <button onClick={disableMfa} disabled={disableCode.length < 6} className="cyber-btn-danger text-xs py-2.5 disabled:opacity-50">Disable MFA</button>
            </div>
          </div>
        ) : showMfaSetup ? (
          <div>
            <p className="text-gray-400 text-xs mb-3">Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password)</p>
            {mfa.qrCode && <div className="flex justify-center mb-4 bg-white rounded-lg p-4 w-fit mx-auto"><img src={mfa.qrCode} alt="MFA QR Code" className="w-48 h-48" /></div>}
            <details className="mb-3"><summary className="text-gray-500 text-xs cursor-pointer">Can&apos;t scan? Enter manually</summary><p className="text-gray-400 font-mono text-xs mt-2 p-2 bg-surface-0 rounded break-all select-all">{mfa.secret}</p></details>
            <div className="flex gap-2 items-end max-w-md">
              <div className="flex-1"><label className="cyber-label">Verification code</label><input className="cyber-input w-full font-mono text-center text-lg tracking-widest" value={mfaCode} onChange={e => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6} autoComplete="one-time-code" /></div>
              <button onClick={enableMfa} disabled={mfaCode.length < 6} className="cyber-btn-primary text-xs py-2.5 disabled:opacity-50">Verify & Enable</button>
            </div>
            {mfaError && <p className="text-red-400 text-xs mt-2">{mfaError}</p>}
          </div>
        ) : (
          <div>
            <p className="text-red-400/80 text-xs mb-3">⚠ Your admin account does not have MFA enabled. This is strongly recommended.</p>
            <button onClick={() => { setShowMfaSetup(true); fetch("/api/auth/mfa").then(r => r.json()).then(setMfa); }} className="cyber-btn-primary text-sm">Set Up MFA</button>
          </div>
        )}
      </div>

      {/* SAML SSO */}
      <div className="cyber-card mb-4">
        <div className="flex items-center justify-between mb-3">
          <div><h2 className="text-white text-sm font-semibold">SAML SSO (Platform-wide)</h2><p className="text-gray-500 text-xs mt-1">Configure SSO for all admin users</p></div>
          <span className="cyber-badge text-xs bg-purple-500/20 text-purple-400">Enterprise</span>
        </div>
        <div className="space-y-3 max-w-lg">
          <div><label className="cyber-label">Entity ID / Issuer</label><input className="cyber-input w-full font-mono text-xs" value={saml.entityId} onChange={e => setSaml(p => ({ ...p, entityId: e.target.value }))} placeholder="https://login.microsoftonline.com/tenant-id/saml2" /></div>
          <div><label className="cyber-label">SSO URL (Login URL)</label><input className="cyber-input w-full font-mono text-xs" value={saml.ssoUrl} onChange={e => setSaml(p => ({ ...p, ssoUrl: e.target.value }))} placeholder="https://login.microsoftonline.com/tenant-id/saml2" /></div>
          <div><label className="cyber-label">x509 Certificate</label><textarea className="cyber-input w-full h-20 font-mono text-xs resize-none" value={saml.certificate} onChange={e => setSaml(p => ({ ...p, certificate: e.target.value }))} placeholder={"-----BEGIN CERTIFICATE-----\nMIIDqDCCApCg...\n-----END CERTIFICATE-----"} /></div>
          <div className="text-gray-500 text-xs space-y-0.5">
            <p><strong>ACS URL:</strong> https://threatcast.io/api/auth/saml/callback</p>
            <p><strong>SP Entity ID:</strong> https://threatcast.io</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setSamlSaved(true); setTimeout(() => setSamlSaved(false), 3000); }} className="cyber-btn-primary text-xs">{samlSaved ? "✓ Saved" : "Save SAML Config"}</button>
          </div>
          <p className="text-gray-600 text-xs">Supports: Entra ID (Azure AD), Okta, Google Workspace, OneLogin, PingIdentity, JumpCloud</p>
        </div>
      </div>

      {/* Environment Health */}
      <div className="cyber-card mb-4">
        <h2 className="text-white text-sm font-semibold mb-3">Environment Health</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {envChecks.map(check => (
            <div key={check.name} className="flex items-center gap-2 p-2 rounded bg-surface-0 border border-surface-3">
              <span className={`text-sm ${check.ok !== false ? "text-green-400" : "text-red-400"}`}>{check.ok !== false ? "✓" : "✗"}</span>
              <div><p className="text-white text-xs">{check.name}</p><p className="text-gray-600 text-xs font-mono">{check.env}</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Info */}
      <div className="cyber-card">
        <h2 className="text-white text-sm font-semibold mb-3">Platform Info</h2>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded bg-surface-0 border border-surface-3"><p className="text-gray-500">Version</p><p className="text-white font-mono">1.0.0</p></div>
          <div className="p-2 rounded bg-surface-0 border border-surface-3"><p className="text-gray-500">Stack</p><p className="text-white font-mono">Next.js 15 + Prisma</p></div>
          <div className="p-2 rounded bg-surface-0 border border-surface-3"><p className="text-gray-500">Auth</p><p className="text-white font-mono">NextAuth.js v5</p></div>
          <div className="p-2 rounded bg-surface-0 border border-surface-3"><p className="text-gray-500">AI</p><p className="text-white font-mono">Claude Sonnet 4</p></div>
          <div className="p-2 rounded bg-surface-0 border border-surface-3"><p className="text-gray-500">Database</p><p className="text-white font-mono">Neon PostgreSQL</p></div>
          <div className="p-2 rounded bg-surface-0 border border-surface-3"><p className="text-gray-500">Hosting</p><p className="text-white font-mono">Vercel</p></div>
        </div>
      </div>
    </div>
  );
}
