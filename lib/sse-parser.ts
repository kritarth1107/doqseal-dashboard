/**
 * SSE event types as defined in the cross-repo contract v1.
 */
export type SSEEventType =
  | "run.started"
  | "step"
  | "token"
  | "citation"
  | "decline"
  | "run.completed"
  | "error";

export type StepName =
  | "understanding"
  | "retrieving"
  | "reranking"
  | "reading"
  | "querying_fields"
  | "checking_coverage"
  | "generating"
  | "verifying";

export type StepStatus = "started" | "done";

export interface RunStartedEvent {
  type: "run.started";
  runId: string;
  conversationId: string | null;
}

export interface StepEvent {
  type: "step";
  id: string;
  name: StepName;
  status: StepStatus;
  label: string;
  detail?: {
    chunks?: number;
    documents?: number;
    titles?: string[];
  };
}

export interface TokenEvent {
  type: "token";
  text: string;
}

export interface CitationEvent {
  type: "citation";
  n: number;
  documentId: string;
  title: string;
  page: number | null;
  quote: string;
}

export interface DeclineEvent {
  type: "decline";
  reason: "not_covered" | "off_topic" | "small_talk";
  message: string;
}

export interface RunCompletedEvent {
  type: "run.completed";
  mode: "answered" | "declined" | "partial";
  usage?: Record<string, unknown>;
  latencyMs: number;
}

export interface ErrorEvent {
  type: "error";
  code: string;
  message: string;
}

export type SSEEvent =
  | RunStartedEvent
  | StepEvent
  | TokenEvent
  | CitationEvent
  | DeclineEvent
  | RunCompletedEvent
  | ErrorEvent;

/**
 * Parses a single SSE event from text format.
 * Format: "event: <type>\ndata: <json>\n\n"
 */
export function parseSSEEvent(eventText: string): SSEEvent | null {
  const lines = eventText.trim().split("\n");
  let eventType: string | null = null;
  let dataJson: string | null = null;

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventType = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataJson = line.slice(5).trim();
    } else if (line.startsWith(":")) {
      continue;
    }
  }

  if (!eventType || !dataJson) {
    return null;
  }

  try {
    const data = JSON.parse(dataJson);
    return { type: eventType, ...data } as SSEEvent;
  } catch {
    return null;
  }
}

/**
 * Creates an async iterator that parses SSE events from a ReadableStream.
 */
export async function* parseSSEStream(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<SSEEvent, void, unknown> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        if (buffer.trim()) {
          const event = parseSSEEvent(buffer);
          if (event) yield event;
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const eventText of events) {
        if (!eventText.trim()) continue;
        if (eventText.trim().startsWith(":")) continue;

        const event = parseSSEEvent(eventText);
        if (event) yield event;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Step reducer state for tracking the thinking trace.
 */
export interface StepTraceState {
  steps: Array<{
    id: string;
    name: StepName;
    label: string;
    status: StepStatus;
    detail?: StepEvent["detail"];
  }>;
  activeStepId: string | null;
}

export type StepTraceAction =
  | { type: "step"; event: StepEvent }
  | { type: "reset" };

/**
 * Reducer for managing step trace state.
 */
export function stepTraceReducer(
  state: StepTraceState,
  action: StepTraceAction
): StepTraceState {
  switch (action.type) {
    case "reset":
      return { steps: [], activeStepId: null };

    case "step": {
      const { event } = action;
      const existingIndex = state.steps.findIndex((s) => s.id === event.id);

      if (existingIndex >= 0) {
        const newSteps = [...state.steps];
        newSteps[existingIndex] = {
          ...newSteps[existingIndex],
          status: event.status,
          detail: event.detail ?? newSteps[existingIndex].detail,
        };
        return {
          steps: newSteps,
          activeStepId: event.status === "started" ? event.id : state.activeStepId,
        };
      }

      return {
        steps: [
          ...state.steps,
          {
            id: event.id,
            name: event.name,
            label: event.label,
            status: event.status,
            detail: event.detail,
          },
        ],
        activeStepId: event.status === "started" ? event.id : state.activeStepId,
      };
    }

    default:
      return state;
  }
}

export const initialStepTraceState: StepTraceState = {
  steps: [],
  activeStepId: null,
};
