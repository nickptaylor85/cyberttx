import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes that don't require auth
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/pricing",
  "/about",
]);

// Admin routes - only super admins
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "cyberttx.com";

  // Determine subdomain
  let subdomain: string | null = null;

  // Dev mode: use query param or header
  if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    subdomain = url.searchParams.get("org") || null;
  } else if (!hostname.includes("vercel.app")) {
    // Production: extract from hostname
    const parts = hostname.split(".");
    const domainParts = appDomain.split(".");
    if (parts.length > domainParts.length) {
      const sub = parts.slice(0, parts.length - domainParts.length).join(".");
      if (!["www", "api", "admin", "app"].includes(sub)) {
        subdomain = sub;
      }
    }
  }

  // If we have a subdomain, rewrite to portal routes
  if (subdomain) {
    // Store subdomain in headers for downstream use
    const headers = new Headers(req.headers);
    headers.set("x-org-slug", subdomain);

    // Rewrite /portal paths
    if (!url.pathname.startsWith("/portal") && !url.pathname.startsWith("/api") && !url.pathname.startsWith("/sign")) {
      url.pathname = `/portal${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.rewrite(url, { headers });
    }

    return NextResponse.next({ headers });
  }

  // Protect non-public routes
  if (!isPublicRoute(req)) {
    const session = await auth();
    if (!session.userId) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Admin route protection (check super admin in API routes)
  if (isAdminRoute(req)) {
    const session = await auth();
    if (!session.userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
