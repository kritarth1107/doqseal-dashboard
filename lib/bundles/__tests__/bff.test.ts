import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (cookieJar.has(name) ? { value: cookieJar.get(name) } : undefined) }),
}));

import * as bundlesRoute from "@/app/api/bundles/[[...path]]/route";
import * as templatesRoute from "@/app/api/bundle-templates/[[...path]]/route";

function request(url: string, init: RequestInit = {}) {
  const req = new Request(url, {
    ...init,
    headers: { "x-organisation-id": "org-a", ...(init.headers as Record<string, string>) },
  });
  Object.assign(req, {
    cookies: { get: (name: string) => (cookieJar.has(name) ? { value: cookieJar.get(name) } : undefined) },
  });
  return req;
}

const ctx = (path?: string[]) => ({ params: Promise.resolve({ path }) });

describe("bundle BFF routes", () => {
  const realFetch = global.fetch;
  let upstream: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.test/api/v1/";
    cookieJar.clear();
    cookieJar.set("session_token", "tok");
    upstream = vi.fn(async () => new Response(JSON.stringify({ success: true, data: [] }), { status: 200 }));
    global.fetch = upstream as unknown as typeof fetch;
  });
  afterEach(() => {
    global.fetch = realFetch;
  });

  it("requires a session", async () => {
    cookieJar.clear();
    const res = await bundlesRoute.GET(request("http://localhost/api/bundles"), ctx());
    expect(res.status).toBe(401);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("forwards path, query, session and org", async () => {
    const res = await bundlesRoute.GET(request("http://localhost/api/bundles?q=a&status=ready"), ctx());
    expect(res.status).toBe(200);
    const [url, init] = upstream.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.test/api/v1/bundles?q=a&status=ready");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization ?? headers.authorization).toBe("Bearer tok");
    expect(headers["x-organisation-id"]).toBe("org-a");
  });

  it("forwards review actions with a JSON body", async () => {
    await bundlesRoute.POST(
      request("http://localhost/api/bundles/b1/review", {
        method: "POST",
        body: JSON.stringify({ note: "ok" }),
        headers: { "content-type": "application/json" },
      }),
      ctx(["b1", "review"])
    );
    const [url, init] = upstream.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.test/api/v1/bundles/b1/review");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ note: "ok" }));
  });

  it("uses the template base for template routes", async () => {
    await templatesRoute.GET(request("http://localhost/api/bundle-templates/starters"), ctx(["starters"]));
    expect(upstream.mock.calls[0][0]).toBe("https://api.example.test/api/v1/bundle-templates/starters");
  });

  it("refuses unexpected path segments and bad JSON", async () => {
    const res = await bundlesRoute.GET(request("http://localhost/api/bundles/x"), ctx(["..", "admin"]));
    expect(res.status).toBe(404);
    const bad = await bundlesRoute.POST(
      request("http://localhost/api/bundles", { method: "POST", body: "{nope" }),
      ctx()
    );
    expect(bad.status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("passes backend status and code through (feature off)", async () => {
    upstream.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: false, message: "Feature not enabled: bundles", code: "FEATURE_DISABLED" }), {
        status: 403,
      })
    );
    const res = await bundlesRoute.GET(request("http://localhost/api/bundles"), ctx());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Feature not enabled: bundles", code: "FEATURE_DISABLED" });
  });

  it("returns 502 when the backend cannot be reached", async () => {
    upstream.mockRejectedValueOnce(new TypeError("fetch failed"));
    const res = await bundlesRoute.GET(request("http://localhost/api/bundles"), ctx());
    expect(res.status).toBe(502);
  });
});
