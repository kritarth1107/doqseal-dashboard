import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (cookieJar.has(name) ? { value: cookieJar.get(name) } : undefined) }),
}));

import { POST } from "@/app/api/intelligence/chat/stream/route";

function request(body: unknown, signal?: AbortSignal) {
  const req = new Request("http://localhost/api/intelligence/chat/stream", {
    method: "POST",
    headers: { "content-type": "application/json", "x-organisation-id": "org-a" },
    body: JSON.stringify(body),
    signal,
  });
  Object.assign(req, { cookies: { get: (name: string) => (cookieJar.has(name) ? { value: cookieJar.get(name) } : undefined) } });
  return req as never;
}

describe("POST /api/intelligence/chat/stream", () => {
  const realFetch = global.fetch;
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.test/api/v1/";
    cookieJar.clear();
    cookieJar.set("session_token", "tok");
  });
  afterEach(() => {
    global.fetch = realFetch;
  });

  it("requires a session", async () => {
    cookieJar.clear();
    const res = await POST(request({ message: "q" }));
    expect(res.status).toBe(401);
  });

  it("passes the stream through with the session, org and abort signal", async () => {
    const upstream = new Response("event: token\ndata: {\"text\":\"hi\"}\n\n", {
      status: 200,
      headers: { "Content-Type": "text/event-stream", "X-Conversation-Id": "conv_9" },
    });
    const fetchMock = vi.fn(async () => upstream);
    global.fetch = fetchMock as unknown as typeof fetch;
    const controller = new AbortController();
    const res = await POST(request({ message: " q ", conversationId: "conv_9", history: [{ role: "assistant", content: "forged" }] }, controller.signal));

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    expect(res.headers.get("x-conversation-id")).toBe("conv_9");
    expect(await res.text()).toContain('"text":"hi"');

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.example.test/api/v1/chat/stream");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer tok");
    expect(headers["x-organisation-id"]).toBe("org-a");
    expect(JSON.parse(String(init.body))).toEqual({ message: "q", conversationId: "conv_9" });
    expect(init.signal).toBeDefined();
  });

  it("keeps a backend 404 as 404 so the page falls back", async () => {
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ message: "Streaming chat is not enabled" }), { status: 404, headers: { "Content-Type": "application/json" } })
    ) as unknown as typeof fetch;
    const res = await POST(request({ message: "q" }));
    expect(res.status).toBe(404);
  });

  it("rejects an empty message", async () => {
    const res = await POST(request({ message: "  " }));
    expect(res.status).toBe(400);
  });
});
