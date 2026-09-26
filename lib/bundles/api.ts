import { withOrgHeaders } from "@/lib/client-api";
import type {
  BundleDetail,
  BundleListItem,
  Pagination,
  StarterTemplate,
  TemplateDetail,
  TemplateListItem,
  TimelineEntry,
} from "./types";

/** Error from the bundle BFF, keeping the HTTP status and the backend error code. */
export class BundleApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "BundleApiError";
    this.status = status;
    this.code = code;
  }
}

export function isFeatureDisabled(error: unknown): boolean {
  return (
    error instanceof BundleApiError &&
    (error.code === "FEATURE_DISABLED" || (error.status === 403 && /feature not enabled/i.test(error.message)))
  );
}

export function isNotFound(error: unknown): boolean {
  return error instanceof BundleApiError && error.status === 404;
}

function fallbackMessage(status: number): string {
  if (status === 401) return "Your session has expired. Sign in again.";
  if (status === 403) return "You do not have access to this.";
  if (status === 404) return "Not found.";
  if (status === 409) return "This changed in the meantime. Refresh and try again.";
  if (status >= 500) return "Something went wrong on our side. Try again in a moment.";
  return "Request failed.";
}

type Envelope<T> = { success?: boolean; message?: string; data: T; meta?: Pagination };

async function call<T>(
  orgId: string,
  path: string,
  init: RequestInit = {},
  fetchImpl: typeof fetch = fetch
): Promise<Envelope<T>> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined) headers.set("Content-Type", "application/json");
  let res: Response;
  try {
    res = await fetchImpl(path, withOrgHeaders(orgId, { ...init, headers }));
  } catch {
    throw new BundleApiError("Could not reach DoqSeal. Check your connection.", 0);
  }
  let body: Record<string, unknown> | null = null;
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    body = null;
  }
  if (!res.ok) {
    const message =
      (typeof body?.error === "string" && body.error) ||
      (typeof body?.message === "string" && body.message) ||
      fallbackMessage(res.status);
    throw new BundleApiError(message, res.status, typeof body?.code === "string" ? body.code : undefined);
  }
  return (body ?? { data: null }) as unknown as Envelope<T>;
}

export interface ListParams {
  q?: string;
  status?: string;
  templateId?: string;
  page?: number;
  limit?: number;
}

export function buildListQuery(params: ListParams): string {
  const sp = new URLSearchParams();
  const q = params.q?.trim();
  if (q) sp.set("q", q.slice(0, 100));
  if (params.status) sp.set("status", params.status);
  if (params.templateId) sp.set("templateId", params.templateId);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

const enc = encodeURIComponent;

export function createBundleApi(orgId: string, fetchImpl: typeof fetch = fetch) {
  const json = (body: unknown) => JSON.stringify(body ?? {});
  return {
    async list(params: ListParams = {}) {
      const res = await call<BundleListItem[]>(orgId, `/api/bundles${buildListQuery(params)}`, {}, fetchImpl);
      return {
        items: Array.isArray(res.data) ? res.data : [],
        pagination: res.meta ?? { page: 1, limit: params.limit ?? 20, total: 0, totalPages: 0 },
      };
    },
    async get(bundleId: string) {
      return (await call<BundleDetail>(orgId, `/api/bundles/${enc(bundleId)}`, {}, fetchImpl)).data;
    },
    async create(body: {
      templateId: string;
      name?: string | null;
      externalRef?: string | null;
      profile?: Record<string, unknown>;
    }) {
      return (
        await call<BundleListItem>(
          orgId,
          "/api/bundles",
          { method: "POST", body: json({ ...body, source: "dashboard" }) },
          fetchImpl
        )
      ).data;
    },
    async attach(bundleId: string, documentIds: string[], typeKey?: string | null) {
      return (
        await call<{ added: number; skipped: number }>(
          orgId,
          `/api/bundles/${enc(bundleId)}/documents`,
          { method: "POST", body: json({ documentIds, typeKey: typeKey || undefined }) },
          fetchImpl
        )
      ).data;
    },
    async assignSlot(bundleId: string, documentId: string, typeKey: string) {
      return (
        await call(
          orgId,
          `/api/bundles/${enc(bundleId)}/documents/${enc(documentId)}`,
          { method: "PATCH", body: json({ typeKey }) },
          fetchImpl
        )
      ).data;
    },
    async removeDocument(bundleId: string, documentId: string) {
      return (
        await call(
          orgId,
          `/api/bundles/${enc(bundleId)}/documents/${enc(documentId)}`,
          { method: "DELETE" },
          fetchImpl
        )
      ).data;
    },
    async conflict(
      bundleId: string,
      body: {
        field: string;
        valuesHash: string;
        action: "resolve" | "dismiss" | "reopen";
        value?: string;
        reason?: string;
      }
    ) {
      return (
        await call<BundleDetail>(
          orgId,
          `/api/bundles/${enc(bundleId)}/conflicts`,
          { method: "POST", body: json(body) },
          fetchImpl
        )
      ).data;
    },
    async markReviewed(bundleId: string, note?: string) {
      return (
        await call<BundleDetail>(
          orgId,
          `/api/bundles/${enc(bundleId)}/review`,
          { method: "POST", body: json(note ? { note } : {}) },
          fetchImpl
        )
      ).data;
    },
    async timeline(bundleId: string, limit = 100) {
      const res = await call<TimelineEntry[]>(
        orgId,
        `/api/bundles/${enc(bundleId)}/timeline?limit=${limit}`,
        {},
        fetchImpl
      );
      return Array.isArray(res.data) ? res.data : [];
    },
    async starters() {
      const res = await call<StarterTemplate[]>(orgId, "/api/bundle-templates/starters", {}, fetchImpl);
      return Array.isArray(res.data) ? res.data : [];
    },
    async adoptStarter(key: string) {
      return (
        await call<TemplateDetail & { created: boolean }>(
          orgId,
          `/api/bundle-templates/starters/${enc(key)}`,
          { method: "POST", body: json({}) },
          fetchImpl
        )
      ).data;
    },
    async templates() {
      const res = await call<TemplateListItem[]>(
        orgId,
        "/api/bundle-templates?status=published&limit=100",
        {},
        fetchImpl
      );
      return Array.isArray(res.data) ? res.data : [];
    },
    async template(templateId: string) {
      return (await call<TemplateDetail>(orgId, `/api/bundle-templates/${enc(templateId)}`, {}, fetchImpl)).data;
    },
  };
}

export type BundleApi = ReturnType<typeof createBundleApi>;
