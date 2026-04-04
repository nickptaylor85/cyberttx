import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from Clerk and other sources
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
    ],
  },
};

export default nextConfig;
