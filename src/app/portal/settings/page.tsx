"use client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { SUPPORTED_LANGUAGES, LangCode } from "@/lib/i18n/translations";

export default function SettingsPage() {
  const { lang, setLang, t } = useLanguage();

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">{t("settings.title")}</h1></div>

      {/* Language */}
      <div className="cyber-card mb-6">
        <h2 className="text-white text-sm font-semibold mb-1">{t("settings.language")}</h2>
        <p className="text-gray-500 text-xs mb-4">{t("settings.languageDesc")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {SUPPORTED_LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code as LangCode)}
              className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-all ${
                lang === l.code
                  ? "bg-cyber-600/15 border-cyber-500 text-cyber-400"
                  : "bg-surface-0 border-surface-3 text-gray-400 hover:border-surface-4 hover:text-gray-200"
              }`}
            >
              <span className="text-lg">{l.flag}</span>
              <span>{l.name}</span>
            </button>
          ))}
        </div>
        <p className="text-gray-600 text-xs mt-3">Language applies to your portal navigation, dashboard, and AI-generated exercises.</p>
      </div>

      {/* Subscription */}
      <div className="cyber-card mb-6">
        <h2 className="text-white text-sm font-semibold mb-3">{t("settings.subscription")}</h2>
        <p className="text-gray-400 text-sm">Stripe billing integration coming soon. Contact support@threatcast.io to manage your subscription.</p>
      </div>

      {/* SSO */}
      <div className="cyber-card mb-6">
        <h2 className="text-white text-sm font-semibold mb-3">SSO / SAML</h2>
        <p className="text-gray-400 text-sm">Enterprise SSO configuration available on Enterprise plans. Contact your account manager to enable SAML integration.</p>
      </div>

      {/* Data Export */}
      <div className="cyber-card mb-6">
        <h2 className="text-white text-sm font-semibold mb-3">Data Export</h2>
        <p className="text-gray-400 text-sm mb-3">Download all your organisation&apos;s data including exercises, scores, and compliance evidence.</p>
        <button className="cyber-btn-secondary text-sm">Request Data Export</button>
      </div>

      {/* Danger Zone */}
      <div className="cyber-card border-red-500/30">
        <h2 className="text-red-400 text-sm font-semibold mb-3">{t("settings.dangerZone")}</h2>
        <p className="text-gray-400 text-sm mb-3">Permanently delete your organisation and all associated data. This action cannot be undone.</p>
        <button className="cyber-btn-danger text-sm">Delete Organisation</button>
      </div>
    </div>
  );
}
