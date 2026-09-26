/**
 * Client for the grounded chat stream (text/event-stream).
 * Protocol: run.started, step, token, citation, decline, run.completed, error.
 * A decline can arrive after tokens; it replaces the streamed text.
 */

export type ChatStepStatus = "started" | "done";

export type ChatStep = {
  id?: string;
  name: string;
  status: ChatStepStatus;
  label: string;
  detail?: Record<string, unknown> | null;
};

export type ChatCitation = {
  n: number;
  documentId: string;
  title?: string | null;
  page?: number | null;
  quote?: string | null;
};

export type ChatStreamEvent =
  | { event: "run.started"; data: { runId?: string; conversationId?: string | null } }
  | { event: "step"; data: ChatStep }
  | { event: "token"; data: { text: string } }
  | { event: "citation"; data: ChatCitation }
  | { event: "decline"; data: { reason: string; message: string } }
  | { event: "run.completed"; data: { mode?: string; usage?: Record<string, number>; latencyMs?: number } }
  | { event: "error"; data: { code: string; message: string } };

export type ChatRunState = {
  conversationId: string | null;
  steps: ChatStep[];
  content: string;
  citations: ChatCitation[];
  decline: { reason: string; message: string } | null;
  error: { code: string; message: string } | null;
  mode: string | null;
  done: boolean;
};

export const initialRunState = (): ChatRunState => ({
  conversationId: null,
  steps: [],
  content: "",
  citations: [],
  decline: null,
  error: null,
  mode: null,
  done: false,
});

/** Pure reducer: applies one event to the run state. */
export function applyChatEvent(state: ChatRunState, evt: ChatStreamEvent): ChatRunState {
  switch (evt.event) {
    case "run.started":
      return { ...state, conversationId: evt.data.conversationId ?? state.conversationId };
    case "step": {
      const step = evt.data;
      const key = step.id || step.name;
      const index = state.steps.findIndex((s) => (s.id || s.name) === key);
      const steps =
        index === -1
          ? [...state.steps, step]
          : state.steps.map((s, i) => (i === index ? { ...s, ...step, detail: step.detail ?? s.detail } : s));
      return { ...state, steps };
    }
    case "token":
      if (state.decline) return state;
      return { ...state, content: state.content + (evt.data.text ?? "") };
    case "citation":
      if (state.citations.some((c) => c.n === evt.data.n)) return state;
      return { ...state, citations: [...state.citations, evt.data].sort((a, b) => a.n - b.n) };
    case "decline":
      return { ...state, decline: evt.data, content: evt.data.message, citations: [] };
    case "run.completed":
      return {
        ...state,
        mode: evt.data.mode ?? (state.decline ? "declined" : "answered"),
        done: true,
        steps: state.steps.map((s) => ({ ...s, status: "done" as const })),
      };
    case "error":
      return {
        ...state,
        error: evt.data,
        mode: "error",
        done: true,
        steps: state.steps.map((s) => ({ ...s, status: "done" as const })),
      };
    default:
      return state;
  }
}

const KNOWN_EVENTS = new Set(["run.started", "step", "token", "citation", "decline", "run.completed", "error"]);

/** Parses one SSE block. Comments (heartbeats), unknown events and bad JSON return null. */
export function parseSseBlock(block: string): ChatStreamEvent | null {
  let event = "message";
  const data: string[] = [];
  for (const line of block.split(/\r?\n/)) {
    if (!line || line.startsWith(":")) continue;
    const idx = line.indexOf(":");
    const field = idx === -1 ? line : line.slice(0, idx);
    const value = idx === -1 ? "" : line.slice(idx + 1).replace(/^ /, "");
    if (field === "event") event = value;
    else if (field === "data") data.push(value);
  }
  if (!data.length || !KNOWN_EVENTS.has(event)) return null;
  try {
    return { event, data: JSON.parse(data.join("\n")) } as ChatStreamEvent;
  } catch {
    return null;
  }
}

/** Incremental parser: feed text chunks in any split, get complete events back. */
export function createSseParser() {
  let buffer = "";
  return {
    push(chunk: string): ChatStreamEvent[] {
      buffer += chunk;
      const events: ChatStreamEvent[] = [];
      const boundary = /\r?\n\r?\n/;
      let match: RegExpExecArray | null;
      while ((match = boundary.exec(buffer))) {
        const block = buffer.slice(0, match.index);
        buffer = buffer.slice(match.index + match[0].length);
        const evt = parseSseBlock(block);
        if (evt) events.push(evt);
      }
      return events;
    },
  };
}

export type SendChatOptions = {
  message: string;
  conversationId?: string | null;
  projectId?: string | null;
  organisationId?: string | null;
  /** Earlier turns, only used by the non-streaming fallback. */
  history?: { role: "user" | "assistant"; content: string }[];
  signal?: AbortSignal;
  onUpdate: (state: ChatRunState) => void;
  fetchImpl?: typeof fetch;
};

export type LegacyChatResult = {
  reply: string;
  documents?: {
    id: string;
    patientName: string;
    filename: string;
    kind?: string;
    fileName?: string;
    status: string;
    href: string;
  }[];
  thinking?: { title: string; detail?: string }[];
  mode?: string;
};

export type SendChatResult =
  | { kind: "stream"; state: ChatRunState; aborted: boolean }
  | { kind: "legacy"; result: LegacyChatResult }
  | { kind: "aborted" };

class HttpError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

function isAbort(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function headers(organisationId?: string | null): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (organisationId) h["x-organisation-id"] = organisationId;
  return h;
}

async function sendLegacy(options: SendChatOptions, doFetch: typeof fetch): Promise<SendChatResult> {
  const res = await doFetch("/api/intelligence/chat", {
    method: "POST",
    headers: headers(options.organisationId),
    signal: options.signal,
    body: JSON.stringify({
      projectId: options.projectId || undefined,
      messages: [...(options.history ?? []), { role: "user", content: options.message }],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new HttpError(data.error || "Failed to get response", res.status);
  return { kind: "legacy", result: data as LegacyChatResult };
}

/**
 * Streams an answer. Falls back to the non-streaming endpoint when streaming
 * is not available (404/501/503 before any event), so older backends keep working.
 */
export async function sendChat(options: SendChatOptions): Promise<SendChatResult> {
  const doFetch = options.fetchImpl ?? fetch;
  let state = initialRunState();
  let response: Response;
  try {
    response = await doFetch("/api/intelligence/chat/stream", {
      method: "POST",
      headers: { ...headers(options.organisationId), Accept: "text/event-stream" },
      signal: options.signal,
      body: JSON.stringify({
        message: options.message,
        conversationId: options.conversationId || undefined,
        projectId: options.projectId || undefined,
      }),
    });
  } catch (error) {
    if (isAbort(error)) return { kind: "aborted" };
    throw error;
  }

  const contentType = response.headers.get("content-type") || "";
  if (!response.ok || !contentType.includes("text/event-stream") || !response.body) {
    if ([404, 501, 503].includes(response.status)) {
      try {
        return await sendLegacy(options, doFetch);
      } catch (error) {
        if (isAbort(error)) return { kind: "aborted" };
        throw error;
      }
    }
    const data = await response.json().catch(() => ({}));
    throw new HttpError(data.error || data.message || "Failed to get response", response.status);
  }

  const headerConversation = response.headers.get("x-conversation-id");
  if (headerConversation) {
    state = { ...state, conversationId: headerConversation };
    options.onUpdate(state);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parser = createSseParser();
  // Stop reading as soon as the user stops, whatever the fetch implementation does.
  const onAbort = () => {
    reader.cancel().catch(() => {});
  };
  options.signal?.addEventListener("abort", onAbort, { once: true });
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      for (const evt of parser.push(decoder.decode(value, { stream: true }))) {
        state = applyChatEvent(state, evt);
        options.onUpdate(state);
      }
    }
  } catch (error) {
    if (isAbort(error) || options.signal?.aborted) {
      return { kind: "stream", state: { ...state, done: true, mode: "aborted" }, aborted: true };
    }
    throw error;
  } finally {
    options.signal?.removeEventListener("abort", onAbort);
    reader.releaseLock?.();
  }
  if (options.signal?.aborted) {
    return { kind: "stream", state: { ...state, done: true, mode: "aborted" }, aborted: true };
  }
  if (!state.done) {
    state = applyChatEvent(state, {
      event: "error",
      data: { code: "stream_interrupted", message: "The answer was interrupted. Please try again." },
    });
    options.onUpdate(state);
  }
  return { kind: "stream", state, aborted: false };
}
