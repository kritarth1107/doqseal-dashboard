import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side deep-link redirect for FlutterWebAuth2.
 * Custom Tabs reliably follow HTTP Location redirects to custom schemes;
 * JS window.location can fail on some Android versions.
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const method = request.nextUrl.searchParams.get("method") || "social";

    if (!token) {
      const login = new URL("/auth/mobile-start", request.nextUrl.origin);
      login.searchParams.set("provider", method === "social" ? "google" : method);
      login.searchParams.set("error", "missing_session");
      return NextResponse.redirect(login);
    }

    const deepLink = new URL("doqseal://oauth");
    deepLink.searchParams.set("token", token);
    deepLink.searchParams.set("method", method);

    // Raw 302 — NextResponse.redirect may reject custom schemes.
    return new Response(null, {
      status: 302,
      headers: {
        Location: deepLink.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("mobile-handoff error:", error);
    return NextResponse.redirect(new URL("/auth", request.nextUrl.origin));
  }
}
