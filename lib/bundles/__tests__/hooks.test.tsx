// @vitest-environment happy-dom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bundle, doc } from "./fixtures";

const auth = {
  activeOrgId: "org-1" as string | null,
  activeOrg: { organisationId: "org-1", name: "Org", role: "member", features: { bundles: true } } as
    | { organisationId: string; name: string; role: string; features?: { bundles?: boolean } }
    | null,
  loading: false,
};
vi.mock("@/components/AuthProvider", () => ({ useAuth: () => auth }));

import { useBundle, useBundleList, useBundleTimeline, useBundlesEnabled } from "../hooks";

type Handler = (url: string, init: RequestInit) => Response | Promise<Response>;
let handler: Handler;
const calls: Array<{ url: string; init: RequestInit }> = [];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

beforeEach(() => {
  calls.length = 0;
  auth.activeOrgId = "org-1";
  auth.activeOrg = { organisationId: "org-1", name: "Org", role: "member", features: { bundles: true } };
  auth.loading = false;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      calls.push({ url, init });
      return handler(url, init);
    })
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useBundlesEnabled", () => {
  it("is on by default and off only when the organisation switched it off", () => {
    expect(renderHook(() => useBundlesEnabled()).result.current).toEqual({ enabled: true, loading: false });
    auth.activeOrg = { organisationId: "org-1", name: "Org", role: "member" };
    expect(renderHook(() => useBundlesEnabled()).result.current.enabled).toBe(true);
    auth.activeOrg = { organisationId: "org-1", name: "Org", role: "member", features: { bundles: false } };
    expect(renderHook(() => useBundlesEnabled()).result.current.enabled).toBe(false);
    auth.activeOrg = null;
    expect(renderHook(() => useBundlesEnabled()).result.current.enabled).toBe(false);
    auth.activeOrg = null;
    auth.loading = true;
    expect(renderHook(() => useBundlesEnabled()).result.current).toEqual({ enabled: false, loading: true });
  });
});

describe("useBundleList", () => {
  it("loads the list with filters and refetches when they change", async () => {
    handler = (url) =>
      json({
        data: [{ bundleId: url.includes("q=b") ? "b2" : "b1", templateId: "t", templateVersion: 1, status: "collecting" }],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });
    const { result, rerender } = renderHook((p: { q: string }) => useBundleList({ q: p.q, limit: 20 }), {
      initialProps: { q: "a" },
    });
    await waitFor(() => expect(result.current.phase).toBe("ready"));
    expect(result.current.items[0].bundleId).toBe("b1");
    expect(calls[0].url).toBe("/api/bundles?q=a&limit=20");
    rerender({ q: "b" });
    await waitFor(() => expect(result.current.items[0]?.bundleId).toBe("b2"));
  });

  it("shows the disabled state on the backend's 403", async () => {
    handler = () => json({ error: "Feature not enabled: bundles", code: "FEATURE_DISABLED" }, 403);
    const { result } = renderHook(() => useBundleList({}));
    await waitFor(() => expect(result.current.phase).toBe("disabled"));
  });

  it("does nothing without an organisation", () => {
    auth.activeOrgId = null;
    handler = () => json({ data: [] });
    const { result } = renderHook(() => useBundleList({}));
    expect(result.current.phase).toBe("loading");
    expect(calls).toHaveLength(0);
  });
});

describe("useBundle", () => {
  it("loads a pack and marks it reviewed with the returned detail", async () => {
    const loaded = bundle({
      status: "ready_to_run",
      documents: [doc({ documentId: "d1", typeKey: "pan_card" }), doc({ documentId: "d2", typeKey: "bank_statement" })],
    });
    handler = (url, init) => {
      if (url === "/api/bundles/b1/review" && init.method === "POST") {
        return json({ data: { ...loaded, status: "ready", reviewed: true } });
      }
      return json({ data: loaded });
    };
    const { result } = renderHook(() => useBundle("b1"));
    await waitFor(() => expect(result.current.phase).toBe("ready"));
    expect(result.current.view?.bundleId).toBe("b1");

    let ok = false;
    await act(async () => {
      ok = (await result.current.actions!.markReviewed("fine")) as boolean;
    });
    expect(ok).toBe(true);
    expect(result.current.view?.reviewed).toBe(true);
    const review = calls.find((c) => c.url.endsWith("/review"))!;
    expect(JSON.parse(review.init.body as string)).toEqual({ note: "fine" });
  });

  it("keeps the error next to the action when the server refuses", async () => {
    handler = (url, init) =>
      init.method === "POST"
        ? json({ error: "This bundle still has open items: 1 conflict" }, 409)
        : json({ data: bundle({ documents: [doc()] }) });
    const { result } = renderHook(() => useBundle("b1"));
    await waitFor(() => expect(result.current.phase).toBe("ready"));
    await act(async () => {
      await result.current.actions!.markReviewed();
    });
    expect(result.current.actionError).toEqual({ key: "review", message: "This bundle still has open items: 1 conflict" });
    expect(result.current.isPending("review")).toBe(false);
  });

  it("moves a document optimistically, then refreshes", async () => {
    let assigned = false;
    handler = (url, init) => {
      if (init.method === "PATCH") {
        assigned = true;
        return json({ data: {} });
      }
      return json({ data: bundle({ documents: [doc({ documentId: "d1", typeKey: assigned ? "pan_card" : null })] }) });
    };
    const { result } = renderHook(() => useBundle("b1"));
    await waitFor(() => expect(result.current.phase).toBe("ready"));
    await act(async () => {
      await result.current.actions!.assignSlot("d1", "pan_card");
    });
    expect(result.current.view?.documents[0].typeKey).toBe("pan_card");
    expect(result.current.optimisticSlots).toEqual({});
    const patch = calls.find((c) => c.init.method === "PATCH")!;
    expect(patch.url).toBe("/api/bundles/b1/documents/d1");
  });

  it("reports a missing pack", async () => {
    handler = () => json({ error: "Bundle not found" }, 404);
    const { result } = renderHook(() => useBundle("nope"));
    await waitFor(() => expect(result.current.phase).toBe("not_found"));
  });
});

describe("useBundleTimeline", () => {
  it("loads entries and reloads when the version changes", async () => {
    let n = 0;
    handler = () => {
      n += 1;
      return json({
        data: [{ id: `e${n}`, action: "bundle.create", timestamp: "2026-09-26T10:00:00Z", actor: { userId: null, name: "System", isSystem: true }, details: {} }],
      });
    };
    const { result, rerender } = renderHook((p: { v: string }) => useBundleTimeline("b1", p.v), {
      initialProps: { v: "1" },
    });
    await waitFor(() => expect(result.current.phase).toBe("ready"));
    expect(result.current.entries[0].id).toBe("e1");
    rerender({ v: "2" });
    await waitFor(() => expect(result.current.entries[0].id).toBe("e2"));
  });

  it("keeps entries if a later reload fails", async () => {
    let fail = false;
    handler = () =>
      fail
        ? json({ error: "down" }, 500)
        : json({ data: [{ id: "e1", action: "bundle.create", timestamp: "", actor: { userId: null, name: "S", isSystem: true }, details: {} }] });
    const { result, rerender } = renderHook((p: { v: string }) => useBundleTimeline("b1", p.v), {
      initialProps: { v: "1" },
    });
    await waitFor(() => expect(result.current.phase).toBe("ready"));
    fail = true;
    rerender({ v: "2" });
    await waitFor(() => expect(result.current.error).toBe("down"));
    expect(result.current.phase).toBe("ready");
    expect(result.current.entries).toHaveLength(1);
  });
});
