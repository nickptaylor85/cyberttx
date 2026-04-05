import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Pages that don't need auth
const isPublicPage = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/pricing",
  "/about",
]);

// API routes that don't need auth
const isPublicApi = createRouteMatcher([
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "threatcast.io";
  const isApiRoute = url.pathname.startsWith("/api/");

  // Subdomain detection
  let subdomain: string | null = null;
  if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    subdomain = url.searchParams.get("org") || null;
  } else if (!hostname.includes("vercel.app")) {
    const parts = hostname.split(".");
    const domainParts = appDomain.split(".");
    if (parts.length > domainParts.length) {
      const sub = parts.slice(0, parts.length - domainParts.length).join(".");
      if (!["www", "api", "admin", "app"].includes(sub)) subdomain = sub;
    }
  }

  if (subdomain) {
    const headers = new Headers(req.headers);
    headers.set("x-org-slug", subdomain);
    if (!url.pathname.startsWith("/portal") && !url.pathname.startsWith("/api") && !url.pathname.startsWith("/sign")) {
      url.pathname = `/portal${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.rewrite(url, { headers });
    }
    return NextResponse.next({ headers });
  }

  // Public webhooks - pass through
  if (isPublicApi(req)) {
    return NextResponse.next();
  }

  // Get auth state
  const { userId } = await auth();

  // API routes: inject userId header if authenticated, return 401 if not
  if (isApiRoute) {
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const headers = new Headers(req.headers);
    headers.set("x-clerk-user-id", userId);
    return NextResponse.next({ headers });
  }

  // Page routes: redirect to sign-in if not authenticated
  if (!isPublicPage(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
    const headers = new Headers(req.headers);
    headers.set("x-clerk-user-id", userId);
    return NextResponse.next({ headers });
  }

  // Public pages: still inject userId if available
  if (userId) {
    const headers = new Headers(req.headers);
    headers.set("x-clerk-user-id", userId);
    return NextResponse.next({ headers });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
