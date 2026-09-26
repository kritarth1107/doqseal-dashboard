import { describe, expect, it } from "vitest";
import { BundleApiError } from "../api";
import { detailReducer, initialDetailState, initialListState, listReducer, withOptimisticSlots } from "../reducer";
import { bundle, doc } from "./fixtures";

const disabled = new BundleApiError("Feature not enabled: bundles", 403, "FEATURE_DISABLED");

describe("detailReducer", () => {
  it("loads", () => {
    const b = bundle();
    const s = detailReducer(initialDetailState, { type: "loaded", bundle: b, at: 1 });
    expect(s).toMatchObject({ phase: "ready", bundle: b, stale: false, updatedAt: 1 });
  });

  it("maps errors to phases", () => {
    expect(detailReducer(initialDetailState, { type: "load_failed", error: disabled, background: false }).phase).toBe(
      "disabled"
    );
    expect(
      detailReducer(initialDetailState, { type: "load_failed", error: new BundleApiError("nope", 404), background: false })
        .phase
    ).toBe("not_found");
    const e = detailReducer(initialDetailState, { type: "load_failed", error: new Error("boom"), background: false });
    expect(e).toMatchObject({ phase: "error", error: "boom" });
  });

  it("keeps the last data and marks it stale when a background refresh fails", () => {
    const ready = detailReducer(initialDetailState, { type: "loaded", bundle: bundle(), at: 1 });
    const s = detailReducer(ready, { type: "load_failed", error: new Error("net"), background: true });
    expect(s.phase).toBe("ready");
    expect(s.stale).toBe(true);
    expect(s.bundle).toBe(ready.bundle);
    // ...but a switched-off feature always wins.
    expect(detailReducer(ready, { type: "load_failed", error: disabled, background: true }).phase).toBe("disabled");
  });

  it("applies a slot pick optimistically and rolls back on failure", () => {
    const ready = detailReducer(initialDetailState, {
      type: "loaded",
      bundle: bundle({ documents: [doc({ documentId: "d1" })] }),
      at: 1,
    });
    const picked = detailReducer(ready, { type: "slot_start", documentId: "d1", typeKey: "pan_card" });
    expect(picked.pending).toEqual(["slot:d1"]);
    expect(withOptimisticSlots(picked)!.documents[0].typeKey).toBe("pan_card");

    const failed = detailReducer(picked, { type: "slot_failed", documentId: "d1", message: "Invalid slot" });
    expect(failed.pending).toEqual([]);
    expect(failed.actionError).toEqual({ key: "slot:d1", message: "Invalid slot" });
    expect(withOptimisticSlots(failed)!.documents[0].typeKey).toBeNull();
  });

  it("drops the optimistic slot once the server agrees", () => {
    const ready = detailReducer(initialDetailState, {
      type: "loaded",
      bundle: bundle({ documents: [doc({ documentId: "d1" })] }),
      at: 1,
    });
    let s = detailReducer(ready, { type: "slot_start", documentId: "d1", typeKey: "pan_card" });
    s = detailReducer(s, { type: "action_done", key: "slot:d1", at: 2 });
    s = detailReducer(s, {
      type: "loaded",
      bundle: bundle({ documents: [doc({ documentId: "d1", typeKey: "pan_card" })] }),
      at: 3,
    });
    expect(s.optimisticSlots).toEqual({});
    expect(withOptimisticSlots(s)!.documents[0].typeKey).toBe("pan_card");
  });

  it("tracks pending actions and takes the returned bundle", () => {
    const ready = detailReducer(initialDetailState, { type: "loaded", bundle: bundle(), at: 1 });
    const started = detailReducer(ready, { type: "action_start", key: "review" });
    expect(started.pending).toEqual(["review"]);
    const reviewed = bundle({ status: "ready", reviewed: true });
    const done = detailReducer(started, { type: "action_done", key: "review", bundle: reviewed, at: 2 });
    expect(done.pending).toEqual([]);
    expect(done.bundle).toBe(reviewed);

    const failed = detailReducer(started, { type: "action_failed", key: "review", message: "still open" });
    expect(failed.actionError).toEqual({ key: "review", message: "still open" });
    expect(detailReducer(failed, { type: "clear_action_error" }).actionError).toBeNull();
  });

  it("does not flash a spinner when reloading with data already shown", () => {
    const ready = detailReducer(initialDetailState, { type: "loaded", bundle: bundle(), at: 1 });
    expect(detailReducer(ready, { type: "load_start" })).toBe(ready);
  });
});

describe("listReducer", () => {
  const page = { page: 1, limit: 20, total: 1, totalPages: 1 };
  const item = { bundleId: "b1", templateId: "t", templateVersion: 1, status: "collecting" as const };

  it("ignores responses from superseded requests", () => {
    let s = listReducer(initialListState, { type: "request", requestId: 1, background: false });
    s = listReducer(s, { type: "request", requestId: 2, background: false });
    s = listReducer(s, { type: "loaded", requestId: 1, items: [item], pagination: page });
    expect(s.phase).toBe("loading");
    s = listReducer(s, { type: "loaded", requestId: 2, items: [], pagination: { ...page, total: 0 } });
    expect(s).toMatchObject({ phase: "ready", items: [] });
  });

  it("keeps rows during background refreshes and marks stale on failure", () => {
    let s = listReducer(initialListState, { type: "request", requestId: 1, background: false });
    s = listReducer(s, { type: "loaded", requestId: 1, items: [item], pagination: page });
    s = listReducer(s, { type: "request", requestId: 2, background: true });
    expect(s.phase).toBe("ready");
    s = listReducer(s, { type: "failed", requestId: 2, error: new Error("net"), background: true });
    expect(s).toMatchObject({ phase: "ready", stale: true, items: [item] });
  });

  it("shows the disabled state when the feature is off", () => {
    let s = listReducer(initialListState, { type: "request", requestId: 1, background: false });
    s = listReducer(s, { type: "failed", requestId: 1, error: disabled, background: false });
    expect(s).toMatchObject({ phase: "disabled", items: [] });
  });
});
