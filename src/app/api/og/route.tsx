import { ImageResponse } from "next/og";
export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", width: "100%", height: "100%", background: "linear-gradient(135deg, #0a0a1a 0%, #111827 50%, #0a0a1a 100%)", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        {/* Grid overlay */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(20,184,154,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,154,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px", display: "flex" }} />
        
        {/* Glow effect */}
        <div style={{ position: "absolute", top: "20%", left: "50%", width: 400, height: 400, background: "radial-gradient(circle, rgba(20,184,154,0.15), transparent 70%)", transform: "translateX(-50%)", display: "flex" }} />

        {/* Shield icon */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: "#14b89a", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <span style={{ fontSize: 32, fontWeight: 800, color: "white" }}>Threat<span style={{ color: "#14b89a" }}>Cast</span></span>
        </div>

        {/* Main text */}
        <h1 style={{ fontSize: 56, fontWeight: 800, color: "white", lineHeight: 1.1, textAlign: "center", margin: 0, maxWidth: 900 }}>
          AI-Powered Cybersecurity
        </h1>
        <h1 style={{ fontSize: 56, fontWeight: 800, color: "#14b89a", lineHeight: 1.1, textAlign: "center", margin: "8px 0 0" }}>
          Tabletop Exercises
        </h1>

        {/* Subtitle */}
        <p style={{ fontSize: 22, color: "#9ca3af", marginTop: 24, textAlign: "center", maxWidth: 700 }}>
          Daily drills · Head-to-head duels · MITRE ATT&CK aligned · SIEM integration
        </p>

        {/* Bottom badges */}
        <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
          <div style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(20,184,154,0.1)", border: "1px solid rgba(20,184,154,0.2)", color: "#14b89a", fontSize: 14 }}>ISO 27001</div>
          <div style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(20,184,154,0.1)", border: "1px solid rgba(20,184,154,0.2)", color: "#14b89a", fontSize: 14 }}>NIST CSF</div>
          <div style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(20,184,154,0.1)", border: "1px solid rgba(20,184,154,0.2)", color: "#14b89a", fontSize: 14 }}>SOC 2</div>
          <div style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(20,184,154,0.1)", border: "1px solid rgba(20,184,154,0.2)", color: "#14b89a", fontSize: 14 }}>MITRE ATT&CK</div>
          <div style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(20,184,154,0.1)", border: "1px solid rgba(20,184,154,0.2)", color: "#14b89a", fontSize: 14 }}>NIS2</div>
        </div>

        {/* URL */}
        <p style={{ position: "absolute", bottom: 24, color: "#4b5563", fontSize: 16 }}>threatcast.io</p>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
