import { cookies, headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED = new Set(["google", "github", "linkedin", "twitter"]);

/**
 * Starts NextAuth OAuth via CSRF auto-submit HTML.
 * Target for FlutterWebAuth2 — avoids client signIn / SessionProvider issues.
 */
export async function GET(request: NextRequest) {
  const raw = (request.nextUrl.searchParams.get("provider") || "google").toLowerCase();
  const provider = ALLOWED.has(raw) ? raw : "google";

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "app.doqseal.com";
  const proto = h.get("x-forwarded-proto") || "https";
  const origin = `${proto}://${host}`;

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const csrfRes = await fetch(`${origin}/api/auth/csrf`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    cache: "no-store",
  });
  const csrfJson = (await csrfRes.json()) as { csrfToken?: string };
  const csrfToken = csrfJson.csrfToken || "";

  // Forward Set-Cookie from CSRF so the POST has a matching token.
  const setCookies = csrfRes.headers.getSetCookie?.() || [];

  const callbackUrl = `${origin}/auth/mobile-bridge?method=${encodeURIComponent(provider)}`;
  const action = `${origin}/api/auth/signin/${provider}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>DoqSeal Sign-in</title>
</head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;background:#f8fafc;color:#0f172a">
  <form id="oauth" method="POST" action="${action}">
    <input type="hidden" name="csrfToken" value="${csrfToken.replace(/"/g, "&quot;")}" />
    <input type="hidden" name="callbackUrl" value="${callbackUrl.replace(/"/g, "&quot;")}" />
  </form>
  <p style="font-size:14px;font-weight:500">Continuing securely…</p>
  <script>document.getElementById('oauth').submit();</script>
</body>
</html>`;

  const response = new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

  for (const c of setCookies) {
    response.headers.append("Set-Cookie", c);
  }

  return response;
}
