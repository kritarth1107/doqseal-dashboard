import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch } from "@/lib/backend-client";

/**
 * Pass-through from the dashboard to the backend bundle API. Keeps the
 * backend status and error code (e.g. 403 FEATURE_DISABLED, 409 conflicts) so
 * the screens can react to them, and only ever reaches paths under the given
 * base (`bundles` or `bundle-templates`).
 */

const SEGMENT = /^[A-Za-z0-9_-]{1,120}$/;
const METHODS = new Set(["GET", "POST", "PATCH", "DELETE"]);

export type BundleBase = "bundles" | "bundle-templates";

export async function proxyBundleRequest(
  request: Request,
  base: BundleBase,
  segments: string[] | undefined
): Promise<Response> {
  const cookieStore = await cookies();
  if (!cookieStore.get("session_token")?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const method = request.method.toUpperCase();
  if (!METHODS.has(method)) {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  const parts = segments ?? [];
  if (parts.length > 4 || parts.some((p) => !SEGMENT.test(p))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const search = new URL(request.url).search;
  const path = [base, ...parts].join("/") + search;

  let body: string | undefined;
  if (method !== "GET" && method !== "DELETE") {
    const raw = await request.text();
    body = raw.trim() ? raw : "{}";
    try {
      JSON.parse(body);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  }

  let upstream: Response;
  try {
    upstream = await backendFetch(request, path, {
      method,
      body,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "Could not reach the DoqSeal service" }, { status: 502 });
  }

  let payload: Record<string, unknown> | null = null;
  try {
    payload = (await upstream.json()) as Record<string, unknown>;
  } catch {
    payload = null;
  }

  if (!upstream.ok) {
    const message =
      (typeof payload?.message === "string" && payload.message) ||
      (typeof payload?.error === "string" && payload.error) ||
      "Request failed";
    return NextResponse.json(
      { error: message, code: typeof payload?.code === "string" ? payload.code : undefined },
      { status: upstream.status, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(payload ?? { success: true, data: null }, {
    status: upstream.status,
    headers: { "Cache-Control": "no-store" },
  });
}
