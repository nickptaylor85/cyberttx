import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ThreatCast - AI-Powered Cybersecurity Tabletop Exercises",
  description: "Run realistic, AI-generated cybersecurity tabletop exercises with your team. Real-time multiplayer, tool-specific scenarios, MITRE ATT&CK aligned.",
  keywords: "cybersecurity,tabletop exercise,incident response,MITRE ATT&CK,security training",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface-0 cyber-grid-bg">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
