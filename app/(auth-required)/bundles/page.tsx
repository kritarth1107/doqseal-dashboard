"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Layers, Plus, RefreshCw, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  CARD_CLASS,
  EmptyState,
  ErrorState,
  FeatureDisabledNotice,
  INPUT_CLASS,
  LoadingState,
  PAGE_CLASS,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  StaleBanner,
  StatusChip,
  formatRelative,
} from "@/components/bundles/ui";
import { ProgressCell } from "@/components/bundles/ProgressCell";
import { useBundleApi, useBundleList } from "@/lib/bundles/hooks";
import { STATUS_FILTERS } from "@/lib/bundles/status";
import type { TemplateListItem } from "@/lib/bundles/types";

const PAGE_SIZE = 20;

export default function BundlesPage() {
  const api = useBundleApi();
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [page, setPage] = useState(1);
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);

  // Debounce the search box so typing does not fire a request per key.
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    api
      .templates()
      .then((list) => !cancelled && setTemplates(list))
      .catch(() => !cancelled && setTemplates([]));
    return () => {
      cancelled = true;
    };
  }, [api]);

  const list = useBundleList({ q, status, templateId, page, limit: PAGE_SIZE });
  const filtered = Boolean(q || status || templateId);

  return (
    <div className={PAGE_CLASS}>
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Case packs"
          description="Collect a case's documents in one place. DoqSeal sorts them into slots, flags missing items and details that differ between documents, and routes them for review."
          actions={
            <Link href="/bundles/new" className={PRIMARY_BUTTON}>
              <Plus className="w-4 h-4" /> New case pack
            </Link>
          }
        />

        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              aria-label="Search case packs"
              placeholder="Search by name or reference…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${INPUT_CLASS} pl-10`}
            />
          </div>
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className={`${INPUT_CLASS} md:w-52`}
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.label} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by template"
            value={templateId}
            onChange={(e) => {
              setTemplateId(e.target.value);
              setPage(1);
            }}
            className={`${INPUT_CLASS} md:w-56`}
          >
            <option value="">All templates</option>
            {templates.map((t) => (
              <option key={t.templateId} value={t.templateId}>
                {t.name}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => void list.refresh()} className={SECONDARY_BUTTON} title="Refresh">
            <RefreshCw className="w-4 h-4" />
            <span className="md:hidden">Refresh</span>
          </button>
        </div>

        {list.stale && <StaleBanner onRetry={() => void list.refresh()} />}

        {list.phase === "disabled" ? (
          <FeatureDisabledNotice />
        ) : list.phase === "loading" && list.items.length === 0 ? (
          <LoadingState label="Loading case packs…" />
        ) : list.phase === "error" ? (
          <ErrorState title="Could not load case packs" message={list.error} onRetry={() => void list.refresh()} />
        ) : list.items.length === 0 ? (
          filtered ? (
            <EmptyState
              icon={<Search className="w-10 h-10 text-slate-300" />}
              title="No case packs match these filters"
              message="Try a different search or clear the filters."
              action={
                <button
                  type="button"
                  className={SECONDARY_BUTTON}
                  onClick={() => {
                    setSearch("");
                    setStatus("");
                    setTemplateId("");
                  }}
                >
                  Clear filters
                </button>
              }
            />
          ) : (
            <EmptyState
              icon={<Layers className="w-10 h-10 text-slate-300" />}
              title="No case packs yet"
              message="Start from a template for your line of business, then add the customer's documents. DoqSeal shows what is missing and what differs between documents."
              action={
                <Link href="/bundles/new" className={PRIMARY_BUTTON}>
                  <Plus className="w-4 h-4" /> Create a case pack
                </Link>
              }
            />
          )
        ) : (
          <>
            <div className={`${CARD_CLASS} overflow-hidden`}>
              <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-gray-100 dark:border-zinc-800">
                <div className="col-span-4">Case pack</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-4">Progress</div>
                <div className="col-span-2 text-right">Updated</div>
              </div>
              {list.items.map((b) => (
                <Link
                  key={b.bundleId}
                  href={`/bundles/${b.bundleId}`}
                  className="grid lg:grid-cols-12 gap-3 lg:gap-4 px-5 py-4 border-b border-gray-100 dark:border-zinc-800 last:border-0 hover:bg-gray-50/80 dark:hover:bg-zinc-800/40 items-center"
                >
                  <div className="lg:col-span-4 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {b.name || b.externalRef || "Untitled case pack"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {[b.externalRef && b.name ? b.externalRef : null, b.templateName].filter(Boolean).join(" · ") ||
                        "—"}
                    </p>
                  </div>
                  <div className="lg:col-span-2">
                    <StatusChip status={b.status} reviewed={b.reviewed} />
                  </div>
                  <div className="lg:col-span-4">
                    <ProgressCell progress={b.progress} documentCount={b.documentCount} />
                  </div>
                  <div className="lg:col-span-2 lg:text-right text-xs text-slate-500">
                    {formatRelative(b.updatedAt)}
                  </div>
                </Link>
              ))}
            </div>
            {list.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 text-sm text-slate-600 dark:text-slate-300">
                <span>
                  Page {list.pagination.page} of {list.pagination.totalPages} · {list.pagination.total} case packs
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={SECONDARY_BUTTON}
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <button
                    type="button"
                    className={SECONDARY_BUTTON}
                    disabled={page >= list.pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
