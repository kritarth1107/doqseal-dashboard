import { describe, it, expect } from "vitest";
import {
  parseSSEEvent,
  stepTraceReducer,
  initialStepTraceState,
  type StepEvent,
} from "../sse-parser";

describe("parseSSEEvent", () => {
  it("parses a token event", () => {
    const eventText = 'event: token\ndata: {"text":"Hello"}';
    const result = parseSSEEvent(eventText);
    expect(result).toEqual({ type: "token", text: "Hello" });
  });

  it("parses a step event", () => {
    const eventText =
      'event: step\ndata: {"id":"s1","name":"retrieving","status":"started","label":"Searching documents","detail":{"chunks":10}}';
    const result = parseSSEEvent(eventText);
    expect(result).toEqual({
      type: "step",
      id: "s1",
      name: "retrieving",
      status: "started",
      label: "Searching documents",
      detail: { chunks: 10 },
    });
  });

  it("parses a citation event", () => {
    const eventText =
      'event: citation\ndata: {"n":1,"documentId":"doc-123","title":"Report","page":5,"quote":"Important text"}';
    const result = parseSSEEvent(eventText);
    expect(result).toEqual({
      type: "citation",
      n: 1,
      documentId: "doc-123",
      title: "Report",
      page: 5,
      quote: "Important text",
    });
  });

  it("parses a decline event", () => {
    const eventText =
      'event: decline\ndata: {"reason":"not_covered","message":"I cannot answer that."}';
    const result = parseSSEEvent(eventText);
    expect(result).toEqual({
      type: "decline",
      reason: "not_covered",
      message: "I cannot answer that.",
    });
  });

  it("parses run.started event", () => {
    const eventText =
      'event: run.started\ndata: {"runId":"run-1","conversationId":"conv-1"}';
    const result = parseSSEEvent(eventText);
    expect(result).toEqual({
      type: "run.started",
      runId: "run-1",
      conversationId: "conv-1",
    });
  });

  it("parses run.completed event", () => {
    const eventText =
      'event: run.completed\ndata: {"mode":"answered","latencyMs":1234}';
    const result = parseSSEEvent(eventText);
    expect(result).toEqual({
      type: "run.completed",
      mode: "answered",
      latencyMs: 1234,
    });
  });

  it("parses error event", () => {
    const eventText =
      'event: error\ndata: {"code":"rate_limit","message":"Too many requests"}';
    const result = parseSSEEvent(eventText);
    expect(result).toEqual({
      type: "error",
      code: "rate_limit",
      message: "Too many requests",
    });
  });

  it("returns null for invalid event (no event type)", () => {
    const eventText = 'data: {"text":"Hello"}';
    const result = parseSSEEvent(eventText);
    expect(result).toBeNull();
  });

  it("returns null for invalid event (no data)", () => {
    const eventText = "event: token";
    const result = parseSSEEvent(eventText);
    expect(result).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    const eventText = "event: token\ndata: {invalid json}";
    const result = parseSSEEvent(eventText);
    expect(result).toBeNull();
  });

  it("ignores comment lines", () => {
    const eventText = ': ping\nevent: token\ndata: {"text":"Hi"}';
    const result = parseSSEEvent(eventText);
    expect(result).toEqual({ type: "token", text: "Hi" });
  });
});

describe("stepTraceReducer", () => {
  it("adds a new step on started", () => {
    const event: StepEvent = {
      type: "step",
      id: "s1",
      name: "retrieving",
      status: "started",
      label: "Searching documents",
    };

    const state = stepTraceReducer(initialStepTraceState, { type: "step", event });

    expect(state.steps).toHaveLength(1);
    expect(state.steps[0]).toEqual({
      id: "s1",
      name: "retrieving",
      label: "Searching documents",
      status: "started",
      detail: undefined,
    });
    expect(state.activeStepId).toBe("s1");
  });

  it("updates an existing step to done", () => {
    const initialState = {
      steps: [
        {
          id: "s1",
          name: "retrieving" as const,
          label: "Searching documents",
          status: "started" as const,
          detail: { chunks: 10 },
        },
      ],
      activeStepId: "s1",
    };

    const event: StepEvent = {
      type: "step",
      id: "s1",
      name: "retrieving",
      status: "done",
      label: "Searching documents",
      detail: { chunks: 15, documents: 5 },
    };

    const state = stepTraceReducer(initialState, { type: "step", event });

    expect(state.steps).toHaveLength(1);
    expect(state.steps[0].status).toBe("done");
    expect(state.steps[0].detail).toEqual({ chunks: 15, documents: 5 });
    expect(state.activeStepId).toBe("s1");
  });

  it("adds multiple steps in sequence", () => {
    let state = initialStepTraceState;

    const step1: StepEvent = {
      type: "step",
      id: "s1",
      name: "understanding",
      status: "started",
      label: "Understanding question",
    };
    state = stepTraceReducer(state, { type: "step", event: step1 });

    const step1Done: StepEvent = { ...step1, status: "done" };
    state = stepTraceReducer(state, { type: "step", event: step1Done });

    const step2: StepEvent = {
      type: "step",
      id: "s2",
      name: "retrieving",
      status: "started",
      label: "Searching documents",
    };
    state = stepTraceReducer(state, { type: "step", event: step2 });

    expect(state.steps).toHaveLength(2);
    expect(state.steps[0].status).toBe("done");
    expect(state.steps[1].status).toBe("started");
    expect(state.activeStepId).toBe("s2");
  });

  it("resets state", () => {
    const initialState = {
      steps: [
        {
          id: "s1",
          name: "retrieving" as const,
          label: "Searching",
          status: "done" as const,
        },
      ],
      activeStepId: null,
    };

    const state = stepTraceReducer(initialState, { type: "reset" });

    expect(state).toEqual(initialStepTraceState);
  });

  it("preserves detail when not provided in update", () => {
    const initialState = {
      steps: [
        {
          id: "s1",
          name: "retrieving" as const,
          label: "Searching documents",
          status: "started" as const,
          detail: { chunks: 10 },
        },
      ],
      activeStepId: "s1",
    };

    const event: StepEvent = {
      type: "step",
      id: "s1",
      name: "retrieving",
      status: "done",
      label: "Searching documents",
    };

    const state = stepTraceReducer(initialState, { type: "step", event });

    expect(state.steps[0].detail).toEqual({ chunks: 10 });
  });
});
