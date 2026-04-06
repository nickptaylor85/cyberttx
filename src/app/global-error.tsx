"use client";
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html><body style={{ background: "#0a0a1a", color: "#fff", fontFamily: "-apple-system, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", margin: 0 }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <p style={{ fontSize: 48 }}>⚠️</p>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Something went wrong</h1>
        <p style={{ color: "#888", fontSize: 14, marginTop: 8 }}>An unexpected error occurred. Our team has been notified.</p>
        <button onClick={reset} style={{ background: "#14b89a", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 16 }}>Try Again</button>
        <p style={{ marginTop: 16 }}><a href="/" style={{ color: "#14b89a", fontSize: 13 }}>Back to ThreatCast</a></p>
      </div>
    </body></html>
  );
}
