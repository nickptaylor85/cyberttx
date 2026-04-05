import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress X-Powered-By header
  poweredByHeader: false,

  // Allow images from Clerk and other sources
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.dev",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://img.clerk.com https://images.clerk.dev",
              "font-src 'self'",
              "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.dev https://api.anthropic.com wss://*.pusher.com",
              "frame-src 'self' https://*.clerk.accounts.dev",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
