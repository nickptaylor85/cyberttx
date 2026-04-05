import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extract the subdomain from a hostname
 * e.g., "acme.threatcast.io" -> "acme"
 *       "threatcast.io" -> null
 *       "localhost:3000" -> null
 */
export function extractSubdomain(hostname: string): string | null {
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "threatcast.io";

  // Local development
  if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    // Use header-based subdomain in dev: ?subdomain=acme
    return null;
  }

  // Vercel preview URLs
  if (hostname.includes("vercel.app")) {
    return null;
  }

  // Production: extract subdomain from custom domain
  const parts = hostname.replace(`:${process.env.PORT || "3000"}`, "").split(".");
  const domainParts = appDomain.split(".");

  if (parts.length > domainParts.length) {
    const subdomain = parts.slice(0, parts.length - domainParts.length).join(".");
    // Reserved subdomains
    if (["www", "api", "admin", "app", "mail", "smtp"].includes(subdomain)) {
      return null;
    }
    return subdomain;
  }

  return null;
}

/**
 * Format a number as a score display
 */
export function formatScore(score: number): string {
  return score.toLocaleString();
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Generate a unique channel name for a TTX session
 */
export function generateChannelName(sessionId: string): string {
  return `private-ttx-${sessionId}`;
}

/**
 * Check if a user has a specific plan feature
 */
export function hasFeature(plan: string, feature: string): boolean {
  const { PLAN_LIMITS } = require("@/types");
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];
  return limits?.features?.includes(feature) ?? false;
}
