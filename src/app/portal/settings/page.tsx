"use client";
import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { SUPPORTED_LANGUAGES, LangCode } from "@/lib/i18n/translations";

export default function SettingsPage() {
  const { lang, setLang, t } = useLanguage();

  // Password change state
  const [currentPw, setCurrentPw] = useState(""); const [newPw, setNewPw] = useState("");
  const [pwError, setPwError] = useState(""); const [pwSuccess, setPwSuccess] = useState(false); const [pwLoading, setPwLoading] = useState(false);
  async function changePassword() {
    setPwError(""); setPwLoading(true);
    const res = await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }) });
    const data = await res.json();
    if (data.success) { setPwSuccess(true); setCurrentPw(""); setNewPw(""); setTimeout(() => setPwSuccess(false), 3000); }
    else setPwError(data.error || "Failed");
    setPwLoading(false);
  }

  // MFA state
  const [mfa, setMfa] = useState<{ enabled: boolean; secret?: string; qrCode?: string }>({ enabled: false });
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [mfaLoading, setMfaLoading] = useState(true);
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [disableCode, setDisableCode] = useState("");

  useEffect(() => {
    fetch("/api/auth/mfa").then(r => r.json()).then(d => { setMfa(d); setMfaLoading(false); }).catch(() => setMfaLoading(false));
  }, []);

  async function enableMfa() {
    if (mfaCode.length !== 6) return;
    setMfaError("");
    const res = await fetch("/api/auth/mfa", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: mfaCode, secret: mfa.secret }),
    });
    const data = await res.json();
    if (data.success) { setMfa({ enabled: true }); setShowMfaSetup(false); setMfaCode(""); }
    else setMfaError(data.error || "Verification failed");
  }

  async function disableMfa() {
    if (disableCode.length !== 6) return;
    const res = await fetch("/api/auth/mfa", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: disableCode }),
    });
    const data = await res.json();
    if (data.success) { setMfa({ enabled: false }); setDisableCode(""); }
    else setMfaError(data.error || "Invalid code");
  }

  // SAML state
  const [samlConfig, setSamlConfig] = useState({ entityId: "", ssoUrl: "", certificate: "", enabled: false });

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">{t("settings.title")}</h1></div>

      {/* Password Change */}
      <div className="cyber-card mb-6">
        <h2 className="text-white text-sm font-semibold mb-3">Change Password</h2>
        <div className="space-y-3">
          <div><label className="cyber-label">Current Password</label><input type="password" className="cyber-input w-full" value={currentPw} onChange={e => setCurrentPw(e.target.value)} /></div>
          <div><label className="cyber-label">New Password</label><input type="password" className="cyber-input w-full" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Minimum 8 characters" minLength={8} /></div>
          {pwError && <p className="text-red-400 text-xs">{pwError}</p>}
          {pwSuccess && <p className="text-green-400 text-xs">Password updated!</p>}
          <button onClick={changePassword} disabled={pwLoading || !currentPw || newPw.length < 8} className="cyber-btn-primary text-sm disabled:opacity-50">{pwLoading ? "Updating..." : "Update Password"}</button>
        </div>
      </div>

      {/* MFA */}
      <div className="cyber-card mb-6">
        <div className="flex items-center justify-between mb-3">
          <div><h2 className="text-white text-sm font-semibold">Two-Factor Authentication (MFA)</h2><p className="text-gray-500 text-xs mt-1">Add an extra layer of security with TOTP authenticator</p></div>
          <span className={`cyber-badge text-xs ${mfa.enabled ? "bg-green-500/20 text-green-400" : "bg-surface-3 text-gray-400"}`}>{mfa.enabled ? "Enabled" : "Disabled"}</span>
        </div>

        {mfaLoading ? <p className="text-gray-500 text-xs">Loading...</p> : mfa.enabled ? (
          <div>
            <p className="text-green-400 text-xs mb-3">✓ MFA is active. You&apos;ll be asked for a code on every sign-in.</p>
            <div className="flex gap-2 items-end">
              <div className="flex-1"><label className="cyber-label">Enter code to disable</label><input className="cyber-input w-full font-mono text-center" value={disableCode} onChange={e => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6} /></div>
              <button onClick={disableMfa} disabled={disableCode.length < 6} className="cyber-btn-danger text-xs py-2.5 disabled:opacity-50">Disable MFA</button>
            </div>
          </div>
        ) : showMfaSetup ? (
          <div>
            <p className="text-gray-400 text-xs mb-3">Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)</p>
            {mfa.qrCode && <div className="flex justify-center mb-4 bg-white rounded-lg p-4 w-fit mx-auto"><img src={mfa.qrCode} alt="MFA QR Code" className="w-48 h-48" /></div>}
            <details className="mb-3"><summary className="text-gray-500 text-xs cursor-pointer">Can&apos;t scan? Enter manually</summary><p className="text-gray-400 font-mono text-xs mt-2 p-2 bg-surface-0 rounded break-all select-all">{mfa.secret}</p></details>
            <div className="flex gap-2 items-end">
              <div className="flex-1"><label className="cyber-label">Verification code</label><input className="cyber-input w-full font-mono text-center text-lg tracking-widest" value={mfaCode} onChange={e => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6} autoComplete="one-time-code" /></div>
              <button onClick={enableMfa} disabled={mfaCode.length < 6} className="cyber-btn-primary text-xs py-2.5 disabled:opacity-50">Verify & Enable</button>
            </div>
            {mfaError && <p className="text-red-400 text-xs mt-2">{mfaError}</p>}
          </div>
        ) : (
          <button onClick={() => { setShowMfaSetup(true); fetch("/api/auth/mfa").then(r => r.json()).then(setMfa); }} className="cyber-btn-primary text-sm">Set Up MFA</button>
        )}
      </div>

      {/* SAML SSO */}
      <div className="cyber-card mb-6">
        <div className="flex items-center justify-between mb-3">
          <div><h2 className="text-white text-sm font-semibold">SAML SSO</h2><p className="text-gray-500 text-xs mt-1">Enterprise single sign-on via your identity provider</p></div>
          <span className="cyber-badge text-xs bg-purple-500/20 text-purple-400">Enterprise</span>
        </div>
        <div className="space-y-3">
          <div><label className="cyber-label">Entity ID / Issuer</label><input className="cyber-input w-full font-mono text-xs" value={samlConfig.entityId} onChange={e => setSamlConfig(p => ({ ...p, entityId: e.target.value }))} placeholder="https://login.microsoftonline.com/tenant-id/saml2" /></div>
          <div><label className="cyber-label">SSO URL (Login URL)</label><input className="cyber-input w-full font-mono text-xs" value={samlConfig.ssoUrl} onChange={e => setSamlConfig(p => ({ ...p, ssoUrl: e.target.value }))} placeholder="https://login.microsoftonline.com/tenant-id/saml2" /></div>
          <div><label className="cyber-label">x509 Certificate</label><textarea className="cyber-input w-full h-24 font-mono text-xs resize-none" value={samlConfig.certificate} onChange={e => setSamlConfig(p => ({ ...p, certificate: e.target.value }))} placeholder="-----BEGIN CERTIFICATE-----&#10;MIIDqDCCApCg...&#10;-----END CERTIFICATE-----" /></div>
          <div className="flex items-center justify-between">
            <div className="text-gray-500 text-xs">
              <p><strong>ACS URL:</strong> https://threatcast.io/api/auth/saml/callback</p>
              <p><strong>SP Entity ID:</strong> https://threatcast.io</p>
            </div>
            <button className="cyber-btn-primary text-xs">Save SAML Config</button>
          </div>
          <p className="text-gray-600 text-xs">Supports: Entra ID (Azure AD), Okta, Google Workspace, OneLogin, PingIdentity, JumpCloud</p>
        </div>
      </div>

      {/* Language */}
      <div className="cyber-card mb-6">
        <h2 className="text-white text-sm font-semibold mb-1">{t("settings.language")}</h2>
        <p className="text-gray-500 text-xs mb-4">{t("settings.languageDesc")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">{SUPPORTED_LANGUAGES.map(l => (
          <button key={l.code} onClick={() => setLang(l.code as LangCode)} className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-all ${lang === l.code ? "bg-cyber-600/15 border-cyber-500 text-cyber-400" : "bg-surface-0 border-surface-3 text-gray-400 hover:border-surface-4"}`}>
            <span className="text-lg">{l.flag}</span><span>{l.name}</span>
          </button>
        ))}</div>
      </div>

      {/* Subscription */}
      <div className="cyber-card mb-6">
        <h2 className="text-white text-sm font-semibold mb-3">{t("settings.subscription")}</h2>
        <p className="text-gray-400 text-sm">Stripe billing integration coming soon. Contact support@threatcast.io to manage your subscription.</p>
      </div>

      {/* Data Export */}
      <div className="cyber-card mb-6">
        <h2 className="text-white text-sm font-semibold mb-3">Data Export</h2>
        <p className="text-gray-400 text-sm mb-3">Download all your organisation&apos;s data for GDPR data portability.</p>
        <a href="/portal/export" className="cyber-btn-secondary text-sm">Go to Export →</a>
      </div>

      {/* Danger Zone */}
      <div className="cyber-card border-red-500/30">
        <h2 className="text-red-400 text-sm font-semibold mb-3">{t("settings.dangerZone")}</h2>
        <p className="text-gray-400 text-sm mb-3">Permanently delete your organisation and all associated data. This cannot be undone.</p>
        <div className="flex gap-2 items-center">
          <input id="confirmOrgName" className="cyber-input text-sm flex-1" placeholder="Type organisation name to confirm" />
          <button onClick={() => {
            const name = (document.getElementById("confirmOrgName") as HTMLInputElement)?.value;
            if (!name) return alert("Type your organisation name to confirm");
            if (!confirm("This will permanently delete the organisation, all users, exercises, playbooks, certificates, and duels. This cannot be undone. Are you sure?")) return;
            fetch("/api/portal/delete-org", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmName: name }) })
              .then(r => r.json()).then(d => { if (d.success) { alert("Organisation deleted."); window.location.href = "/"; } else alert(d.error || "Failed"); });
          }} className="cyber-btn-danger text-sm whitespace-nowrap">Delete Organisation</button>
        </div>
      </div>

      {/* GDPR */}
      <div className="cyber-card border-surface-3">
        <h3 className="text-white text-sm font-semibold mb-2">Your Data Rights (GDPR)</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-400 text-sm">Download all your personal data</p><p className="text-gray-600 text-xs">Article 15 — Right of Access</p></div>
            <a href="/api/portal/gdpr-export" download className="cyber-btn-secondary text-xs">Download My Data</a>
          </div>
          <div className="border-t border-surface-3 pt-3">
            <p className="text-gray-400 text-sm mb-2">Delete your account and all personal data</p>
            <p className="text-gray-600 text-xs mb-2">Article 17 — Right to Erasure. This permanently removes your account, exercise history, playbooks, certificates, and all associated data.</p>
            <div className="flex gap-2 items-center">
              <input id="confirmEmail" className="cyber-input text-sm flex-1" placeholder="Type your email to confirm" />
              <button onClick={() => {
                const email = (document.getElementById("confirmEmail") as HTMLInputElement)?.value;
                if (!email) return alert("Type your email to confirm");
                if (!confirm("This will permanently delete your account and all data. This CANNOT be undone. Are you absolutely sure?")) return;
                fetch("/api/portal/delete-account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmEmail: email }) })
                  .then(r => r.json()).then(d => { if (d.success) { alert("Account deleted."); window.location.href = "/"; } else alert(d.error || "Failed"); });
              }} className="cyber-btn-danger text-xs whitespace-nowrap">Delete My Account</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
