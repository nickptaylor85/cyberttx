import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import CookieConsent from "@/components/CookieConsent";
import "./globals.css";

export const metadata: Metadata = {
  title: "ThreatCast - AI-Powered Cybersecurity Tabletop Exercises",
  description: "Run realistic, AI-generated cybersecurity tabletop exercises with your team. Real-time multiplayer, tool-specific scenarios, MITRE ATT&CK aligned.",
  keywords: "cybersecurity,tabletop exercise,incident response,MITRE ATT&CK,security training,TTX,cyber drill",
  metadataBase: new URL("https://threatcast.io"),
  openGraph: {
    title: "ThreatCast - AI-Powered Cybersecurity TTX",
    description: "Replace £30k consultancy exercises with unlimited AI-powered tabletop drills. Real-time multiplayer, MITRE ATT&CK aligned, compliance-ready.",
    url: "https://threatcast.io",
    siteName: "ThreatCast",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "ThreatCast - AI-Powered Cybersecurity TTX",
    description: "Replace £30k consultancy exercises with unlimited AI-powered tabletop drills.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface-0 cyber-grid-bg">
        <SessionProvider>{children}</SessionProvider><CookieConsent />
      </body>
    </html>
  );
}
