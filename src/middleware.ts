import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "threatcast.io";

  // Subdomain detection
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
    if (!url.pathname.startsWith("/portal") && !url.pathname.startsWith("/api") && !url.pathname.startsWith("/sign")) {
      url.pathname = `/portal${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.rewrite(url, { headers });
    }
    return NextResponse.next({ headers });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
