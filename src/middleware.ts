import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "threatcast.io";
  const pathname = url.pathname;

  // ─── ADMIN IP ALLOWLIST ─────────────────────────
  // If ADMIN_ALLOWED_IPS is set, restrict /admin and /api/admin to those IPs
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const allowedIps = (process.env.ADMIN_ALLOWED_IPS || "").split(",").map(s => s.trim()).filter(Boolean);
    if (allowedIps.length > 0) {
      const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || req.headers.get("x-real-ip")
        
        || "";
      if (!allowedIps.includes(clientIp)) {
        // Log the blocked attempt
        console.warn(`[ADMIN] Blocked access from IP ${clientIp} to ${pathname}`);
        return new NextResponse(
          JSON.stringify({ error: "Access denied — your IP is not authorised for admin access" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }

  // ─── SUBDOMAIN DETECTION ───────────────────────
  let subdomain: string | null = null;
  if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    subdomain = url.searchParams.get("org") || null;
  } else if (url.searchParams.get("org")) {
    subdomain = url.searchParams.get("org");
  } else if (!hostname.includes("vercel.app")) {
    const parts = hostname.split(".");
    const domainParts = appDomain.split(".");
    if (parts.length > domainParts.length) {
      const sub = parts.slice(0, parts.length - domainParts.length).join(".");
      if (!["www", "api", "admin", "app"].includes(sub)) subdomain = sub;
    }
  }

  // Inject subdomain as header
  if (subdomain) {
    const headers = new Headers(req.headers);
    headers.set("x-org-slug", subdomain);
    if (!pathname.startsWith("/portal") && !pathname.startsWith("/api") && !pathname.startsWith("/sign")) {
      url.pathname = `/portal${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url, { headers });
    }
    const subRes = NextResponse.next({ headers });
    subRes.headers.set('X-Frame-Options', 'DENY');
    subRes.headers.set('X-Content-Type-Options', 'nosniff');
    return subRes;
  }

  // ─── SECURITY HEADERS ──────────────────────────
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.anthropic.com https://api.openai.com https://generativelanguage.googleapis.com wss://*.pusher.com https://api.resend.com; frame-src 'self'; frame-ancestors 'none'");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
