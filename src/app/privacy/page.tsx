export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-white mb-8">Privacy Policy</h1>
      <div className="prose prose-invert prose-sm text-gray-400 space-y-6">
        <p className="text-gray-300">Last updated: April 2026</p>
        <h2 className="text-white text-lg font-semibold">1. Data Controller</h2>
        <p>ThreatCast Ltd, Glasgow, United Kingdom is the data controller for personal data processed through this service.</p>
        <h2 className="text-white text-lg font-semibold">2. Data We Collect</h2>
        <p><strong>Account data:</strong> name, email address, organisation, role. <strong>Usage data:</strong> exercise participation, scores, performance metrics. <strong>Technical data:</strong> IP address, browser type, access times.</p>
        <h2 className="text-white text-lg font-semibold">3. Legal Basis</h2>
        <p>We process data under: (a) contract performance (providing the Service); (b) legitimate interests (improving the Service, security); (c) consent (marketing communications).</p>
        <h2 className="text-white text-lg font-semibold">4. How We Use Data</h2>
        <p>To provide and improve the Service, generate exercise scenarios, produce performance reports, send service notifications, and create anonymised benchmarks.</p>
        <h2 className="text-white text-lg font-semibold">5. Data Sharing</h2>
        <p>We do not sell personal data. We share data with: infrastructure providers (Vercel, Neon), AI providers (Anthropic — for scenario generation, no PII sent), email providers (Resend).</p>
        <h2 className="text-white text-lg font-semibold">6. Data Retention</h2>
        <p>Account data is retained while your account is active and for 12 months after deletion. Exercise data and scores are retained for the duration of your organisation&apos;s subscription.</p>
        <h2 className="text-white text-lg font-semibold">7. Your Rights</h2>
        <p>Under UK/EU GDPR, you have the right to: access, rectify, erase, restrict processing, data portability, and object to processing. Contact support@threatcast.io to exercise these rights.</p>
        <h2 className="text-white text-lg font-semibold">8. International Transfers</h2>
        <p>Data may be processed in the UK, EU, and US. We use standard contractual clauses and adequacy decisions to ensure appropriate safeguards.</p>
        <h2 className="text-white text-lg font-semibold">9. Security</h2>
        <p>We implement encryption in transit (TLS 1.3), encryption at rest, access controls, MFA, and regular security assessments. Passwords are hashed with bcrypt.</p>
        <h2 className="text-white text-lg font-semibold">10. Contact</h2>
        <p>Data Protection Officer: support@threatcast.io · ThreatCast Ltd, Glasgow, United Kingdom</p>
      </div>
    </div>
  );
}
