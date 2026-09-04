import { NextRequest, NextResponse } from "next/server";

const ALLOWED = new Set(["google", "github", "linkedin", "twitter"]);

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

  const host = request.headers.get("host");
  if (host && !host.includes("0.0.0.0") && !host.startsWith("127.")) {
    return `https://${host}`;
  }

  return "https://app.doqseal.com";
}

/**
 * Starts NextAuth OAuth inside FlutterWebAuth2 / Custom Tabs.
 * CSRF is fetched in the browser (avoids Azure loopback/host issues).
 */
export async function GET(request: NextRequest) {
  const raw = (request.nextUrl.searchParams.get("provider") || "google").toLowerCase();
  const provider = ALLOWED.has(raw) ? raw : "google";
  const origin = publicOrigin(request);
  // Handoff does an HTTP 302 to doqseal:// — Custom Tabs capture that reliably.
  const callbackUrl = `${origin}/auth/mobile-handoff?method=${encodeURIComponent(provider)}`;
  const action = `${origin}/api/auth/signin/${provider}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>DoqSeal Sign-in</title>
</head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;background:#f8fafc;color:#0f172a">
  <p id="msg" style="font-size:14px;font-weight:500">Continuing securely…</p>
  <script>
(async function () {
  try {
    var csrfRes = await fetch(${JSON.stringify(`${origin}/api/auth/csrf`)}, {
      credentials: "same-origin",
      cache: "no-store"
    });
    var csrfJson = await csrfRes.json();
    var csrfToken = csrfJson.csrfToken || "";
    if (!csrfToken) throw new Error("Missing CSRF token");

    var form = document.createElement("form");
    form.method = "POST";
    form.action = ${JSON.stringify(action)};

    var csrf = document.createElement("input");
    csrf.type = "hidden";
    csrf.name = "csrfToken";
    csrf.value = csrfToken;
    form.appendChild(csrf);

    var cb = document.createElement("input");
    cb.type = "hidden";
    cb.name = "callbackUrl";
    cb.value = ${JSON.stringify(callbackUrl)};
    form.appendChild(cb);

    document.body.appendChild(form);
    form.submit();
  } catch (e) {
    console.error(e);
    document.getElementById("msg").textContent = "Could not start sign-in. Close and try again.";
  }
})();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
