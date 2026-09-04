import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

function publicOrigin(request: NextRequest): string {
  const env =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (env?.startsWith("http")) return env;

  const xfHost = request.headers.get("x-forwarded-host");
  const xfProto = request.headers.get("x-forwarded-proto") || "https";
  if (xfHost && !xfHost.includes("0.0.0.0")) {
    return `${xfProto}://${xfHost.split(",")[0].trim()}`;
  }

  return "https://app.doqseal.com";
}

/**
 * Server-side deep-link redirect for FlutterWebAuth2.
 * Custom Tabs follow HTTP Location redirects to custom schemes reliably.
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const method = request.nextUrl.searchParams.get("method") || "social";
    const origin = publicOrigin(request);

    if (!token) {
      const login = new URL("/auth/mobile-start", origin);
      login.searchParams.set(
        "provider",
        method === "social" ? "google" : method
      );
      login.searchParams.set("error", "missing_session");
      return NextResponse.redirect(login);
    }

    const deepLink = new URL("doqseal://oauth");
    deepLink.searchParams.set("token", token);
    deepLink.searchParams.set("method", method);

    return new Response(null, {
      status: 302,
      headers: {
        Location: deepLink.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("mobile-handoff error:", error);
    return NextResponse.redirect(new URL("/auth", publicOrigin(request)));
  }
}
