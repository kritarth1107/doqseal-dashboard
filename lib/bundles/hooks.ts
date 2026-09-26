"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createBundleApi, type BundleApi, type ListParams } from "./api";
import { isBusy } from "./derive";
import { createPoller, pollDelay, type Poller } from "./poller";
import {
  detailReducer,
  initialDetailState,
  initialListState,
  listReducer,
  withOptimisticSlots,
} from "./reducer";
import type { BundleDetail, BundleListItem, TimelineEntry } from "./types";

/** True when the active organisation has case packs switched on. */
export function useBundlesEnabled(): { enabled: boolean; loading: boolean } {
  const { activeOrg, loading } = useAuth();
  return { enabled: activeOrg?.features?.bundles === true, loading };
}

export function useBundleApi(): BundleApi | null {
  const { activeOrgId } = useAuth();
  return useMemo(() => (activeOrgId ? createBundleApi(activeOrgId) : null), [activeOrgId]);
}

function usePageVisibility(poller: React.MutableRefObject<Poller | null>) {
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") poller.current?.resume();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [poller]);
}

const hidden = () => typeof document !== "undefined" && document.visibilityState === "hidden";

/** Case pack list with search, filters, paging and background refresh. */
export function useBundleList(params: ListParams) {
  const api = useBundleApi();
  const [state, dispatch] = useReducer(listReducer, initialListState);
  const requestSeq = useRef(0);
  const poller = useRef<Poller | null>(null);
  const key = JSON.stringify(params);

  useEffect(() => {
    if (!api) return;
    const query: ListParams = JSON.parse(key);
    let first = true;
    const p = createPoller<{ items: BundleListItem[]; busy: boolean }>({
      load: async () => {
        const requestId = ++requestSeq.current;
        const background = !first;
        dispatch({ type: "request", requestId, background });
        first = false;
        try {
          const res = await api.list(query);
          dispatch({ type: "loaded", requestId, items: res.items, pagination: res.pagination });
          const busy = res.items.some(
            (b) => b.status === "running" || (b.progress?.inProgress ?? 0) > 0
          );
          return { items: res.items, busy };
        } catch (error) {
          dispatch({ type: "failed", requestId, error, background });
          throw error;
        }
      },
      onData: () => undefined,
      onError: () => undefined,
      nextDelay: (last, errors) => pollDelay(Boolean(last?.busy), errors),
      isHidden: hidden,
    });
    poller.current = p;
    p.start();
    return () => {
      p.stop();
      poller.current = null;
    };
  }, [api, key]);

  usePageVisibility(poller);

  const refresh = useCallback(() => poller.current?.refresh(), []);
  return { ...state, refresh };
}

/** One case pack with live refresh and the review actions. */
export function useBundle(bundleId: string | null) {
  const api = useBundleApi();
  const [state, dispatch] = useReducer(detailReducer, initialDetailState);
  const poller = useRef<Poller | null>(null);

  useEffect(() => {
    if (!api || !bundleId) return;
    let loadedOnce = false;
    dispatch({ type: "load_start" });
    const p = createPoller<BundleDetail>({
      load: () => api.get(bundleId),
      onData: (bundle) => {
        loadedOnce = true;
        dispatch({ type: "loaded", bundle, at: Date.now() });
      },
      onError: (error) => dispatch({ type: "load_failed", error, background: loadedOnce }),
      nextDelay: (last, errors) => pollDelay(isBusy(last), errors),
      isHidden: hidden,
    });
    poller.current = p;
    p.start();
    return () => {
      p.stop();
      poller.current = null;
    };
  }, [api, bundleId]);

  usePageVisibility(poller);

  const refresh = useCallback(() => poller.current?.refresh(), []);

  const run = useCallback(
    async (key: string, fn: () => Promise<BundleDetail | unknown>) => {
      if (!api) return false;
      dispatch({ type: "action_start", key });
      try {
        const result = await fn();
        const bundle =
          result && typeof result === "object" && "bundleId" in (result as object) && "documents" in (result as object)
            ? (result as BundleDetail)
            : undefined;
        dispatch({ type: "action_done", key, bundle, at: Date.now() });
        if (!bundle) await poller.current?.refresh();
        return true;
      } catch (error) {
        dispatch({
          type: "action_failed",
          key,
          message: error instanceof Error ? error.message : "Something went wrong.",
        });
        return false;
      }
    },
    [api]
  );

  const actions = useMemo(() => {
    if (!api || !bundleId) return null;
    return {
      assignSlot: async (documentId: string, typeKey: string) => {
        dispatch({ type: "slot_start", documentId, typeKey });
        try {
          await api.assignSlot(bundleId, documentId, typeKey);
          dispatch({ type: "action_done", key: `slot:${documentId}`, at: Date.now() });
          await poller.current?.refresh();
          return true;
        } catch (error) {
          dispatch({
            type: "slot_failed",
            documentId,
            message: error instanceof Error ? error.message : "Could not move the document.",
          });
          return false;
        }
      },
      removeDocument: (documentId: string) =>
        run(`remove:${documentId}`, () => api.removeDocument(bundleId, documentId)),
      attach: (documentIds: string[], typeKey?: string | null) =>
        run("attach", () => api.attach(bundleId, documentIds, typeKey)),
      resolveConflict: (field: string, valuesHash: string, value: string) =>
        run(`conflict:${field}`, () => api.conflict(bundleId, { field, valuesHash, action: "resolve", value })),
      dismissConflict: (field: string, valuesHash: string, reason: string) =>
        run(`conflict:${field}`, () => api.conflict(bundleId, { field, valuesHash, action: "dismiss", reason })),
      reopenConflict: (field: string, valuesHash: string) =>
        run(`conflict:${field}`, () => api.conflict(bundleId, { field, valuesHash, action: "reopen" })),
      markReviewed: (note?: string) => run("review", () => api.markReviewed(bundleId, note)),
      clearError: () => dispatch({ type: "clear_action_error" }),
    };
  }, [api, bundleId, run]);

  return {
    ...state,
    view: withOptimisticSlots(state),
    refresh,
    actions,
    isPending: (key: string) => state.pending.includes(key),
  };
}

/** Timeline for a pack; reloads when `version` changes (e.g. after each refresh). */
export function useBundleTimeline(bundleId: string | null, version: string | number | null) {
  const api = useBundleApi();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api || !bundleId) return;
    let cancelled = false;
    api
      .timeline(bundleId)
      .then((list) => {
        if (cancelled) return;
        setEntries(list);
        setPhase("ready");
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load the timeline.");
        setPhase((p) => (p === "ready" ? "ready" : "error"));
      });
    return () => {
      cancelled = true;
    };
  }, [api, bundleId, version]);

  return { entries, phase, error };
}
