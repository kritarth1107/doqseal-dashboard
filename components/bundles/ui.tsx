"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Layers, Loader2, RefreshCw } from "lucide-react";
import { statusMeta, TONE_CLASSES } from "@/lib/bundles/status";

export const PAGE_CLASS = "flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-[#0b1220] p-4 sm:p-8 pt-16 sm:pt-20";
export const CARD_CLASS =
  "bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm";
export const PRIMARY_BUTTON =
  "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
export const SECONDARY_BUTTON =
  "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
export const INPUT_CLASS =
  "w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]";

export function StatusChip({ status, reviewed = false }: { status: string; reviewed?: boolean }) {
  const meta = statusMeta(status, reviewed);
  return (
    <span
      title={meta.description}
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${TONE_CLASSES[meta.tone]}`}
    >
      {meta.label}
    </span>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500" role="status">
      <Loader2 className="w-4 h-4 animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message?: string | null;
  onRetry?: () => void;
}) {
  return (
    <div className={`${CARD_CLASS} p-8 text-center`} role="alert">
      <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
      <p className="font-medium text-slate-900 dark:text-slate-100">{title}</p>
      {message && <p className="text-sm text-slate-500 mt-1">{message}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className={`${SECONDARY_BUTTON} mt-4`}>
          <RefreshCw className="w-3.5 h-3.5" /> Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
  icon,
}: {
  title: string;
  message?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700 p-12 text-center">
      <div className="flex justify-center mb-3">{icon ?? <Layers className="w-10 h-10 text-slate-300" />}</div>
      <p className="font-medium text-slate-800 dark:text-slate-100">{title}</p>
      {message && <p className="text-sm text-slate-500 mt-1 mb-4 max-w-md mx-auto">{message}</p>}
      {action}
    </div>
  );
}

/** Shown when the backend says case packs are off for this organisation. */
export function FeatureDisabledNotice() {
  return (
    <EmptyState
      title="Case packs are not switched on for this organisation"
      message="Ask your DoqSeal contact to enable case packs. Your documents and projects are not affected."
      action={
        <Link href="/dashboard" className={SECONDARY_BUTTON}>
          Back to dashboard
        </Link>
      }
    />
  );
}

export function StaleBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
      <span>Could not refresh. Showing the last loaded version.</span>
      <button type="button" onClick={onRetry} className="font-medium underline underline-offset-2">
        Retry
      </button>
    </div>
  );
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function formatRelative(value?: string | null, now = Date.now()): string {
  if (!value) return "";
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} d ago`;
  return formatDateTime(value);
}
