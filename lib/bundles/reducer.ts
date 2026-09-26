import { BundleApiError, isFeatureDisabled } from "./api";
import type { BundleDetail, BundleListItem, Pagination } from "./types";

// ── Detail ────────────────────────────────────────────────────────────────

export type LoadPhase = "loading" | "ready" | "error" | "disabled" | "not_found";

export interface DetailState {
  phase: LoadPhase;
  bundle: BundleDetail | null;
  error: string | null;
  /** A background refresh failed; the shown data may be out of date. */
  stale: boolean;
  /** documentId -> slot key picked by the user but not yet confirmed */
  optimisticSlots: Record<string, string>;
  /** keys of actions in flight, e.g. "slot:d1", "conflict:full_name", "review" */
  pending: string[];
  /** Last action error, shown next to the action */
  actionError: { key: string; message: string } | null;
  updatedAt: number | null;
}

export const initialDetailState: DetailState = {
  phase: "loading",
  bundle: null,
  error: null,
  stale: false,
  optimisticSlots: {},
  pending: [],
  actionError: null,
  updatedAt: null,
};

export type DetailAction =
  | { type: "load_start" }
  | { type: "loaded"; bundle: BundleDetail; at: number }
  | { type: "load_failed"; error: unknown; background: boolean }
  | { type: "slot_start"; documentId: string; typeKey: string }
  | { type: "slot_failed"; documentId: string; message: string }
  | { type: "action_start"; key: string }
  | { type: "action_done"; key: string; bundle?: BundleDetail; at: number }
  | { type: "action_failed"; key: string; message: string }
  | { type: "clear_action_error" };

function without<T>(list: T[], item: T): T[] {
  return list.filter((x) => x !== item);
}

function errorPhase(error: unknown): LoadPhase {
  if (isFeatureDisabled(error)) return "disabled";
  if (error instanceof BundleApiError && error.status === 404) return "not_found";
  return "error";
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

/** Drops optimistic slots the server now agrees with (or has overridden). */
function reconcile(optimistic: Record<string, string>, bundle: BundleDetail, pending: string[]) {
  const next: Record<string, string> = {};
  for (const [documentId, typeKey] of Object.entries(optimistic)) {
    const doc = bundle.documents.find((d) => d.documentId === documentId);
    if (!doc) continue;
    if (doc.typeKey === typeKey) continue;
    if (pending.includes(`slot:${documentId}`)) next[documentId] = typeKey;
  }
  return next;
}

export function detailReducer(state: DetailState, action: DetailAction): DetailState {
  switch (action.type) {
    case "load_start":
      return state.bundle ? state : { ...state, phase: "loading", error: null };
    case "loaded":
      return {
        ...state,
        phase: "ready",
        bundle: action.bundle,
        error: null,
        stale: false,
        optimisticSlots: reconcile(state.optimisticSlots, action.bundle, state.pending),
        updatedAt: action.at,
      };
    case "load_failed": {
      const phase = errorPhase(action.error);
      // Keep showing what we have when a background refresh fails, unless
      // the feature was switched off or the pack is gone.
      if (action.background && state.bundle && phase === "error") {
        return { ...state, stale: true };
      }
      return { ...state, phase, error: messageOf(action.error), stale: false };
    }
    case "slot_start":
      return {
        ...state,
        optimisticSlots: { ...state.optimisticSlots, [action.documentId]: action.typeKey },
        pending: [...without(state.pending, `slot:${action.documentId}`), `slot:${action.documentId}`],
        actionError: null,
      };
    case "slot_failed": {
      const optimisticSlots = { ...state.optimisticSlots };
      delete optimisticSlots[action.documentId];
      return {
        ...state,
        optimisticSlots,
        pending: without(state.pending, `slot:${action.documentId}`),
        actionError: { key: `slot:${action.documentId}`, message: action.message },
      };
    }
    case "action_start":
      return { ...state, pending: [...without(state.pending, action.key), action.key], actionError: null };
    case "action_done": {
      const pending = without(state.pending, action.key);
      if (!action.bundle) return { ...state, pending };
      return {
        ...state,
        pending,
        phase: "ready",
        bundle: action.bundle,
        stale: false,
        optimisticSlots: reconcile(state.optimisticSlots, action.bundle, pending),
        updatedAt: action.at,
      };
    }
    case "action_failed":
      return {
        ...state,
        pending: without(state.pending, action.key),
        actionError: { key: action.key, message: action.message },
      };
    case "clear_action_error":
      return { ...state, actionError: null };
    default:
      return state;
  }
}

/** The bundle as the user should see it, with slot picks still in flight applied. */
export function withOptimisticSlots(state: DetailState): BundleDetail | null {
  const { bundle, optimisticSlots } = state;
  if (!bundle || Object.keys(optimisticSlots).length === 0) return bundle;
  return {
    ...bundle,
    documents: bundle.documents.map((d) =>
      optimisticSlots[d.documentId] ? { ...d, typeKey: optimisticSlots[d.documentId] } : d
    ),
  };
}

// ── List ──────────────────────────────────────────────────────────────────

export interface ListState {
  phase: LoadPhase;
  items: BundleListItem[];
  pagination: Pagination;
  error: string | null;
  stale: boolean;
  /** Increments on every request so late responses can be ignored. */
  requestId: number;
}

export const initialListState: ListState = {
  phase: "loading",
  items: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  error: null,
  stale: false,
  requestId: 0,
};

export type ListAction =
  | { type: "request"; requestId: number; background: boolean }
  | { type: "loaded"; requestId: number; items: BundleListItem[]; pagination: Pagination }
  | { type: "failed"; requestId: number; error: unknown; background: boolean };

export function listReducer(state: ListState, action: ListAction): ListState {
  switch (action.type) {
    case "request":
      return {
        ...state,
        requestId: action.requestId,
        phase: action.background && state.phase === "ready" ? "ready" : "loading",
        error: action.background ? state.error : null,
      };
    case "loaded":
      if (action.requestId !== state.requestId) return state;
      return {
        ...state,
        phase: "ready",
        items: action.items,
        pagination: action.pagination,
        error: null,
        stale: false,
      };
    case "failed": {
      if (action.requestId !== state.requestId) return state;
      const phase = errorPhase(action.error);
      if (action.background && state.phase === "ready" && phase === "error") {
        return { ...state, stale: true };
      }
      return { ...state, phase, error: messageOf(action.error), items: phase === "error" ? state.items : [] };
    }
    default:
      return state;
  }
}
