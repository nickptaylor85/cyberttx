import Link from "next/link";
export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-4 py-12 max-w-3xl mx-auto">
      <Link href="/" className="text-gray-500 text-sm hover:text-white mb-8 inline-block">← Back to ThreatCast</Link>
      <h1 className="font-display text-3xl font-bold text-white mb-6">Privacy Policy</h1>
      <p className="text-gray-500 text-xs mb-8">Last updated: April 2026</p>
      <div className="prose prose-invert prose-sm max-w-none space-y-4 text-gray-400 text-sm leading-relaxed">
        <h2 className="text-white text-lg font-semibold mt-6">1. Information We Collect</h2>
        <p><strong>Account data:</strong> Name, email, password (hashed), organisation name. <strong>Usage data:</strong> Exercise completions, scores, performance metrics. <strong>Integration data:</strong> SIEM/XDR API credentials (encrypted), alert metadata (titles, severities — not full event payloads). <strong>Technical data:</strong> IP address, browser type, access timestamps.</p>
        <h2 className="text-white text-lg font-semibold mt-6">2. How We Use Your Data</h2>
        <p>To provide the Service: generating exercises, tracking performance, producing reports and certificates. To improve the platform: aggregated, anonymised analytics. To communicate: service emails, weekly reports (opt-out available). We never sell your data to third parties.</p>
        <h2 className="text-white text-lg font-semibold mt-6">3. SIEM/XDR Data</h2>
        <p>When you connect security tools, we access alert metadata only (titles, severities, timestamps). We do not store raw event data. Credentials are encrypted at rest using AES-256. Alert data is used solely to generate exercise scenarios and is not shared with other clients or third parties.</p>
        <h2 className="text-white text-lg font-semibold mt-6">4. AI Processing</h2>
        <p>Exercise scenarios are generated using Anthropic&apos;s Claude API. Your company profile, tool stack, and alert metadata may be included in AI prompts to personalise scenarios. Anthropic does not use API inputs to train models. No personally identifiable information is sent to the AI.</p>
        <h2 className="text-white text-lg font-semibold mt-6">5. Data Retention</h2>
        <p>Account data: retained while your account is active + 30 days after deletion. Exercise data: retained for the duration of your subscription. Certificates: 1 year from issuance. SIEM credentials: deleted immediately when you disconnect a connector.</p>
        <h2 className="text-white text-lg font-semibold mt-6">6. Data Security</h2>
        <p>All data encrypted in transit (TLS 1.3) and at rest. Hosted on Vercel (SOC 2 Type II) and Neon PostgreSQL (SOC 2 Type II). Passwords hashed with bcrypt (12 rounds). MFA available via TOTP.</p>
        <h2 className="text-white text-lg font-semibold mt-6">7. Your Rights</h2>
        <p>Under UK GDPR, you have the right to: access your data, rectify inaccuracies, request deletion, restrict processing, data portability, and object to processing. Contact support@threatcast.io to exercise these rights.</p>
        <h2 className="text-white text-lg font-semibold mt-6">8. Cookies</h2>
        <p>We use essential cookies for authentication (NextAuth session token). We do not use advertising or tracking cookies. No third-party analytics cookies.</p>
        <h2 className="text-white text-lg font-semibold mt-6">9. International Transfers</h2>
        <p>Data is processed in the EU/US via Vercel and Neon. Anthropic API calls are processed in the US under their data processing agreement.</p>
        <h2 className="text-white text-lg font-semibold mt-6">10. Contact</h2>
        <p>Data Controller: ThreatCast Ltd, Glasgow, Scotland. Email: privacy@threatcast.io. ICO registration: [pending].</p>
      </div>
    </div>
  );
}
