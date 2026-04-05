import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// ONLY truly public routes
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/pricing",
  "/about",
]);

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "cyberttx.com";

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

  // ENFORCE AUTH on all non-public routes
  if (!isPublicRoute(req)) {
    const session = await auth();
    if (!session.userId) {
      if (url.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
    // Pass userId to route handlers via header — avoids calling auth() again
    const headers = new Headers(req.headers);
    headers.set("x-clerk-user-id", session.userId);
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
