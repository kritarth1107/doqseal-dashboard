import { describe, expect, it, vi } from "vitest";
import {
  applyChatEvent,
  createSseParser,
  initialRunState,
  parseSseBlock,
  sendChat,
  type ChatRunState,
  type ChatStreamEvent,
} from "@/lib/chat-stream";

const sse = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

const ANSWER = [
  sse("run.started", { runId: "r1", conversationId: "conv_1" }),
  ": ping\n\n",
  sse("step", { id: "retrieving", name: "retrieving", status: "started", label: "Searching your documents" }),
  sse("step", { id: "retrieving", name: "retrieving", status: "done", label: "Searching your documents", detail: { chunks: 3 } }),
  sse("token", { text: "Always trade " }),
  sse("token", { text: "on Tuesdays [1]." }),
  sse("citation", { n: 1, documentId: "tips-1", title: "trading-tips.pdf", page: null, quote: "Always trade on Tuesdays." }),
  sse("run.completed", { mode: "answered", usage: { totalTokens: 10 }, latencyMs: 800 }),
].join("");

function streamResponse(text: string, { chunk = 5, headers = {} as Record<string, string>, hang = false } = {}) {
  const encoder = new TextEncoder();
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (let i = 0; i < text.length; i += chunk) {
        if (cancelled) return;
        controller.enqueue(encoder.encode(text.slice(i, i + chunk)));
        await new Promise((r) => setTimeout(r, 0));
      }
      if (!hang) controller.close();
    },
    cancel() {
      cancelled = true;
    },
  });
  const response = new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/event-stream", ...headers },
  });
  return { response, wasCancelled: () => cancelled };
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("SSE parsing", () => {
  it("parses events split across arbitrary chunks, with CRLF and comments", () => {
    const parser = createSseParser();
    const text = ANSWER.replace(/\n/g, "\r\n");
    const events: ChatStreamEvent[] = [];
    for (let i = 0; i < text.length; i += 3) events.push(...parser.push(text.slice(i, i + 3)));
    expect(events.map((e) => e.event)).toEqual([
      "run.started",
      "step",
      "step",
      "token",
      "token",
      "citation",
      "run.completed",
    ]);
  });

  it("ignores unknown events and malformed JSON", () => {
    expect(parseSseBlock('event: surprise\ndata: {"x":1}')).toBeNull();
    expect(parseSseBlock("event: token\ndata: {not json")).toBeNull();
    expect(parseSseBlock(": ping")).toBeNull();
  });
});

describe("run reducer", () => {
  const run = (events: ChatStreamEvent[]) => events.reduce(applyChatEvent, initialRunState());

  it("builds the answer, steps and citations in order", () => {
    const parser = createSseParser();
    const state = run(parser.push(ANSWER));
    expect(state.conversationId).toBe("conv_1");
    expect(state.content).toBe("Always trade on Tuesdays [1].");
    expect(state.steps).toHaveLength(1);
    expect(state.steps[0]).toMatchObject({ status: "done", detail: { chunks: 3 } });
    expect(state.citations.map((c) => c.documentId)).toEqual(["tips-1"]);
    expect(state).toMatchObject({ mode: "answered", done: true, decline: null, error: null });
  });

  it("replaces streamed text with a decline that arrives after tokens", () => {
    const state = run([
      { event: "token", data: { text: "Python is a language" } },
      { event: "citation", data: { n: 1, documentId: "d" } },
      { event: "decline", data: { reason: "not_covered", message: "I could not find that in your documents." } },
      { event: "token", data: { text: " ignored" } },
      { event: "run.completed", data: { mode: "declined" } },
    ]);
    expect(state.content).toBe("I could not find that in your documents.");
    expect(state.citations).toEqual([]);
    expect(state.mode).toBe("declined");
  });

  it("ends on an error event and settles running steps", () => {
    const state = run([
      { event: "step", data: { id: "g", name: "generating", status: "started", label: "Writing" } },
      { event: "error", data: { code: "model_unavailable", message: "Unavailable" } },
    ]);
    expect(state).toMatchObject({ mode: "error", done: true, error: { code: "model_unavailable" } });
    expect(state.steps[0].status).toBe("done");
  });
});

describe("sendChat", () => {
  it("streams to the BFF with the organisation header and reports progress", async () => {
    const { response } = streamResponse(ANSWER, { headers: { "X-Conversation-Id": "conv_1" } });
    const fetchImpl = vi.fn(async () => response);
    const updates: ChatRunState[] = [];
    const result = await sendChat({
      message: "how do I trade?",
      organisationId: "org-a",
      projectId: "p1",
      onUpdate: (s) => updates.push(s),
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/intelligence/chat/stream");
    expect((init.headers as Record<string, string>)["x-organisation-id"]).toBe("org-a");
    expect(JSON.parse(String(init.body))).toEqual({ message: "how do I trade?", projectId: "p1" });
    expect(result.kind).toBe("stream");
    if (result.kind !== "stream") return;
    expect(result.state.content).toBe("Always trade on Tuesdays [1].");
    expect(updates[0].conversationId).toBe("conv_1");
    // Tokens arrive progressively rather than all at once.
    expect(updates.filter((u) => u.content && !u.done).length).toBeGreaterThan(0);
  });

  it.each([404, 503])("falls back to the non-streaming endpoint on %i", async (status) => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json(status, { error: "not enabled" }))
      .mockResolvedValueOnce(json(200, { reply: "From the documents [1].", documents: [], thinking: [], mode: "answered" }));
    const result = await sendChat({
      message: "second",
      history: [
        { role: "user", content: "first" },
        { role: "assistant", content: "answer" },
      ],
      onUpdate: () => {},
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result).toEqual({ kind: "legacy", result: expect.objectContaining({ reply: "From the documents [1]." }) });
    const [url, init] = fetchImpl.mock.calls[1] as [string, RequestInit];
    expect(url).toBe("/api/intelligence/chat");
    expect(JSON.parse(String(init.body)).messages).toEqual([
      { role: "user", content: "first" },
      { role: "assistant", content: "answer" },
      { role: "user", content: "second" },
    ]);
  });

  it("surfaces other failures without falling back", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(json(429, { error: "Daily quota exceeded" }));
    await expect(
      sendChat({ message: "q", onUpdate: () => {}, fetchImpl: fetchImpl as unknown as typeof fetch })
    ).rejects.toThrow("Daily quota exceeded");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("stops reading and cancels the stream when aborted", async () => {
    const { response, wasCancelled } = streamResponse(sse("token", { text: "Always " }), { hang: true });
    const controller = new AbortController();
    const fetchImpl = vi.fn(async () => response);
    const promise = sendChat({
      message: "q",
      signal: controller.signal,
      onUpdate: (s) => {
        if (s.content) controller.abort();
      },
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const result = await promise;
    expect(result).toMatchObject({ kind: "stream", aborted: true, state: { content: "Always ", mode: "aborted" } });
    expect(wasCancelled()).toBe(true);
  });

  it("returns aborted when stopped before the response arrives", async () => {
    const fetchImpl = vi.fn(async () => {
      throw Object.assign(new Error("aborted"), { name: "AbortError" });
    });
    const result = await sendChat({ message: "q", onUpdate: () => {}, fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(result).toEqual({ kind: "aborted" });
  });

  it("marks a stream that ends without run.completed as interrupted", async () => {
    const { response } = streamResponse(sse("token", { text: "half" }));
    const result = await sendChat({ message: "q", onUpdate: () => {}, fetchImpl: (async () => response) as unknown as typeof fetch });
    expect(result).toMatchObject({ kind: "stream", state: { mode: "error", error: { code: "stream_interrupted" } } });
  });
});
