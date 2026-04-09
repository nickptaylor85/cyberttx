export default function ApiDocsPage() {
  const endpoints = [
    { method: "POST", path: "/api/ttx/generate", desc: "Generate a new exercise", auth: "Bearer token", body: '{ "theme": "ransomware", "difficulty": "INTERMEDIATE", "questionCount": 12, "language": "en" }' },
    { method: "GET", path: "/api/ttx/session/{id}", desc: "Get exercise session details", auth: "Bearer token", body: null },
    { method: "POST", path: "/api/ttx/session/{id}/answer", desc: "Submit an answer", auth: "Bearer token", body: '{ "questionIndex": 0, "selectedOption": "B" }' },
    { method: "GET", path: "/api/portal/sessions", desc: "List all exercises for your org", auth: "Bearer token", body: null },
    { method: "GET", path: "/api/portal/benchmarks", desc: "Get performance benchmarks", auth: "Bearer token", body: null },
    { method: "GET", path: "/api/portal/report?sessionId={id}", desc: "Generate executive report (HTML)", auth: "Bearer token", body: null },
    { method: "GET", path: "/api/portal/certificate?sessionId={id}", desc: "Generate completion certificate (HTML)", auth: "Bearer token", body: null },
    { method: "GET", path: "/api/threat-intel", desc: "Get threat intelligence events", auth: "None", body: null },
    { method: "POST", path: "/api/threat-intel", desc: "Trigger threat intel scan", auth: "Bearer token", body: null },
    { method: "POST", path: "/api/portal/invite", desc: "Send team invitations", auth: "Bearer token", body: '{ "emails": ["user@company.com"] }' },
    { method: "POST", path: "/api/auth/register", desc: "Register new user", auth: "None", body: '{ "email": "...", "password": "...", "firstName": "...", "lastName": "..." }' },
    { method: "GET", path: "/api/portal/ai-provider", desc: "Get BYOK AI provider config", auth: "Bearer token (Admin)", body: null },
    { method: "POST", path: "/api/portal/ai-provider", desc: "Save BYOK provider settings (Pro/Enterprise)", auth: "Bearer token (Admin)", body: '{ "provider": "openai", "apiKey": "sk-...", "model": "gpt-4o", "enabled": true }' },
    { method: "GET", path: "/api/portal/gdpr-export", desc: "Download all personal data (GDPR Article 15)", auth: "Bearer token", body: null },
    { method: "POST", path: "/api/portal/delete-account", desc: "Delete your account and all data (GDPR Article 17)", auth: "Bearer token", body: '{ "confirmEmail": "user@company.com" }' },
    { method: "GET", path: "/api/portal/daily-drill", desc: "Get today's adaptive daily drill", auth: "Bearer token", body: null },
    { method: "GET", path: "/api/portal/duels", desc: "List duels for your organisation", auth: "Bearer token", body: null },
    { method: "POST", path: "/api/portal/duels", desc: "Create a new duel challenge", auth: "Bearer token", body: '{ "theme": "ransomware" }' },
  ];
  const mc: Record<string, string> = { GET: "bg-green-500/20 text-green-400", POST: "bg-blue-500/20 text-blue-400", PUT: "bg-yellow-500/20 text-yellow-400", DELETE: "bg-red-500/20 text-red-400" };
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-white mb-2">API Documentation</h1>
      <p className="text-gray-500 text-sm mb-2">Enterprise plan · REST API for programmatic access</p>
      <div className="cyber-card mb-6">
        <h2 className="text-white text-sm font-semibold mb-2">Authentication</h2>
        <p className="text-gray-400 text-xs mb-2">All authenticated endpoints require a session cookie (obtained via sign-in) or an API key in the Authorization header:</p>
        <code className="text-cyber-400 text-xs font-mono bg-surface-0 p-2 rounded block">Authorization: Bearer tc_your_api_key_here</code>
      </div>
      <div className="cyber-card mb-6">
        <h2 className="text-white text-sm font-semibold mb-2">Base URL</h2>
        <code className="text-cyber-400 text-xs font-mono bg-surface-0 p-2 rounded block">https://threatcast.io</code>
      </div>
      <h2 className="font-display text-lg font-bold text-white mb-4">Endpoints</h2>
      <div className="space-y-3">{endpoints.map((ep, i) => (
        <div key={i} className="cyber-card">
          <div className="flex items-center gap-2 mb-2"><span className={`cyber-badge text-xs font-mono ${mc[ep.method]}`}>{ep.method}</span><code className="text-white text-xs font-mono">{ep.path}</code></div>
          <p className="text-gray-400 text-xs mb-1">{ep.desc}</p>
          <p className="text-gray-500 text-xs">Auth: {ep.auth}</p>
          {ep.body && <details className="mt-2"><summary className="text-gray-500 text-xs cursor-pointer">Request body</summary><pre className="text-cyber-400 text-xs font-mono bg-surface-0 p-2 rounded mt-1 overflow-x-auto">{ep.body}</pre></details>}
        </div>
      ))}</div>
    </div>
  );
}
