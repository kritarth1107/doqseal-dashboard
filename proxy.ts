import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isPublicPath(pathname: string): boolean {
  return (
    pathname.startsWith("/r/") ||
    pathname === "/r" ||
    pathname.startsWith("/legal/") ||
    pathname.startsWith("/collect/")
  );
}

/** Primary collect hostname + org custom domains (same App Service). */
function isCollectHost(host: string): boolean {
  const hostname = host.split(":")[0].toLowerCase();
  if (hostname === "collect.doqseal.com") return true;
  if (
    hostname === "app.doqseal.com" ||
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".azurewebsites.net") ||
    hostname.endsWith(".doqseal.com")
  ) {
    return false;
  }
  // Other hostnames bound to this app are treated as white-label collect domains
  return Boolean(hostname);
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get("session_token");
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

  // 1. Skip middleware for static assets, images, and internal Next.js routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const collectHost = isCollectHost(host);

  // Collect host: only public collect/legal surfaces (no dashboard)
  if (collectHost) {
    if (pathname === "/" || !isPublicPath(pathname)) {
      return new NextResponse(
        "DoqSeal Collect — open a share link in the form /r/{slug}",
        { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } }
      );
    }
    return NextResponse.next();
  }

  // Public collect + legal on app host (no auth)
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 2. Check if the current route is an authentication route
  const isAuthRoute = pathname.startsWith("/auth");

  // 3. Logic for authenticated users
  if (token) {
    const isAuthCompletion =
      pathname.startsWith("/auth/hook") ||
      pathname.startsWith("/auth/mobile-bridge") ||
      pathname.startsWith("/auth/mobile-handoff") ||
      pathname.startsWith("/auth/mobile-start");
    if (isAuthRoute && !isAuthCompletion) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } else {
    // 4. Logic for unauthenticated users
    if (!isAuthRoute) {
      return NextResponse.redirect(new URL("/auth", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
