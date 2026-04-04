import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "CyberTTX - AI-Powered Cybersecurity Tabletop Exercises",
  description: "Run realistic, AI-generated cybersecurity tabletop exercises with your team. Real-time multiplayer, tool-specific scenarios, MITRE ATT&CK aligned.",
  keywords: ["cybersecurity", "tabletop exercise", "incident response", "MITRE ATT&CK", "security training"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#14b89a",
          colorBackground: "#12121a",
          colorInputBackground: "#1a1a25",
          colorInputText: "#f3f4f6",
        },
      }}
    >
      <html lang="en" className="dark">
        <body className="min-h-screen bg-surface-0 cyber-grid-bg">{children}</body>
      </html>
    </ClerkProvider>
  );
}
