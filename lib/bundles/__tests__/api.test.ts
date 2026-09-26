import { describe, expect, it, vi } from "vitest";
import { BundleApiError, buildListQuery, createBundleApi, isFeatureDisabled, isNotFound } from "../api";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function setup(response: Response | (() => Promise<Response>)) {
  const fetchImpl = vi.fn(typeof response === "function" ? response : async () => response);
  return { api: createBundleApi("org-1", fetchImpl as unknown as typeof fetch), fetchImpl };
}

function lastCall(fetchImpl: ReturnType<typeof vi.fn>) {
  const [url, init] = fetchImpl.mock.calls.at(-1) as [string, RequestInit];
  return { url, init, headers: new Headers(init.headers) };
}

describe("buildListQuery", () => {
  it("only includes set filters", () => {
    expect(buildListQuery({})).toBe("");
    expect(buildListQuery({ q: "  priya ", status: "needs_review,exceptions_found", page: 2, limit: 20 })).toBe(
      "?q=priya&status=needs_review%2Cexceptions_found&page=2&limit=20"
    );
    expect(buildListQuery({ page: 1 })).toBe("");
  });
});

describe("createBundleApi", () => {
  it("lists with the org header and returns items and pagination", async () => {
    const meta = { page: 1, limit: 20, total: 1, totalPages: 1 };
    const { api, fetchImpl } = setup(jsonResponse({ success: true, data: [{ bundleId: "b1" }], meta }));
    const res = await api.list({ q: "x" });
    expect(res).toEqual({ items: [{ bundleId: "b1" }], pagination: meta });
    const call = lastCall(fetchImpl);
    expect(call.url).toBe("/api/bundles?q=x");
    expect(call.headers.get("x-organisation-id")).toBe("org-1");
  });

  it("creates packs with the dashboard as source", async () => {
    const { api, fetchImpl } = setup(jsonResponse({ data: { bundleId: "b9" } }, 201));
    await api.create({ templateId: "t1", name: "Case" });
    const call = lastCall(fetchImpl);
    expect(call.init.method).toBe("POST");
    expect(JSON.parse(call.init.body as string)).toEqual({ templateId: "t1", name: "Case", source: "dashboard" });
    expect(call.headers.get("content-type")).toBe("application/json");
  });

  it("sends review actions to the real endpoints", async () => {
    const { api, fetchImpl } = setup(async () => jsonResponse({ data: { bundleId: "b1", documents: [] } }));
    await api.conflict("b1", { field: "full_name", valuesHash: "h", action: "resolve", value: "A" });
    expect(lastCall(fetchImpl).url).toBe("/api/bundles/b1/conflicts");
    await api.markReviewed("b1", "looks fine");
    expect(lastCall(fetchImpl).url).toBe("/api/bundles/b1/review");
    expect(JSON.parse(lastCall(fetchImpl).init.body as string)).toEqual({ note: "looks fine" });
    await api.assignSlot("b1", "d/1", "pan_card");
    expect(lastCall(fetchImpl).url).toBe("/api/bundles/b1/documents/d%2F1");
    expect(lastCall(fetchImpl).init.method).toBe("PATCH");
    await api.attach("b1", ["d1"], null);
    expect(JSON.parse(lastCall(fetchImpl).init.body as string)).toEqual({ documentIds: ["d1"] });
    await api.adoptStarter("msme_loan");
    expect(lastCall(fetchImpl).url).toBe("/api/bundle-templates/starters/msme_loan");
    await api.templates();
    expect(lastCall(fetchImpl).url).toBe("/api/bundle-templates?status=published&limit=100");
    await api.createTemplate({ name: "Custom", draft: { documentTypes: [] } });
    expect(lastCall(fetchImpl).url).toBe("/api/bundle-templates");
    expect(lastCall(fetchImpl).init.method).toBe("POST");
    await api.publishTemplate("tpl/1");
    expect(lastCall(fetchImpl).url).toBe("/api/bundle-templates/tpl%2F1/publish");
    await api.timeline("b1");
    expect(lastCall(fetchImpl).url).toBe("/api/bundles/b1/timeline?limit=100");
  });

  it("turns error responses into BundleApiError with status and code", async () => {
    const { api } = setup(jsonResponse({ error: "Feature not enabled: bundles", code: "FEATURE_DISABLED" }, 403));
    const err = await api.get("b1").catch((e) => e);
    expect(err).toBeInstanceOf(BundleApiError);
    expect(isFeatureDisabled(err)).toBe(true);
    expect(err.status).toBe(403);
  });

  it("uses friendly fallbacks and handles network failures", async () => {
    const notFound = await setup(new Response("", { status: 404 })).api.get("x").catch((e) => e);
    expect(isNotFound(notFound)).toBe(true);
    expect(notFound.message).toBe("Not found.");
    const conflict = await setup(new Response("", { status: 409 })).api.get("x").catch((e) => e);
    expect(conflict.message).toMatch(/changed in the meantime/);
    const offline = await setup(() => Promise.reject(new TypeError("fetch failed"))).api.get("x").catch((e) => e);
    expect(offline).toMatchObject({ status: 0 });
  });

  it("does not treat an ordinary 403 as the feature being off", () => {
    expect(isFeatureDisabled(new BundleApiError("Requires admin role or higher", 403))).toBe(false);
  });
});
