"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, RotateCcw, XCircle } from "lucide-react";
import { documentLabel, slotLabel } from "@/lib/bundles/derive";
import { conflictFieldLabel } from "@/lib/bundles/status";
import type { BundleConflict, BundleDetail } from "@/lib/bundles/types";
import { INPUT_CLASS, PRIMARY_BUTTON, SECONDARY_BUTTON, formatDateTime } from "./ui";

export interface ConflictHandlers {
  resolve: (value: string) => void;
  dismiss: (reason: string) => void;
  reopen: () => void;
}

/** Distinct values of a conflict with the documents that carry each one. */
export function conflictValueGroups(conflict: BundleConflict) {
  const groups = new Map<string, BundleConflict["values"]>();
  for (const v of conflict.values) {
    const list = groups.get(v.value) ?? [];
    list.push(v);
    groups.set(v.value, list);
  }
  return [...groups.entries()].map(([value, sources]) => ({ value, sources }));
}

export function ConflictCard({
  bundle,
  conflict,
  canDismiss,
  interactive,
  pending,
  error,
  handlers,
}: {
  bundle: BundleDetail;
  conflict: BundleConflict;
  canDismiss: boolean;
  interactive: boolean;
  pending: boolean;
  error?: string | null;
  handlers?: ConflictHandlers;
}) {
  const status = conflict.status ?? "open";
  const groups = conflictValueGroups(conflict);
  const [picked, setPicked] = useState<string>("");
  const [dismissing, setDismissing] = useState(false);
  const [reason, setReason] = useState("");
  const decided = status !== "open";
  const disabled = pending || Boolean(bundle.readOnly) || !conflict.valuesHash;

  return (
    <div
      className={`rounded-xl border p-4 ${
        decided
          ? "border-gray-200 bg-gray-50/60 dark:border-zinc-800 dark:bg-zinc-900/40"
          : "border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          {status === "open" ? (
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          ) : status === "resolved" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          )}
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {conflictFieldLabel(conflict.field)} differs between documents
            </p>
            {status === "resolved" && conflict.resolution && (
              <p className="text-xs text-slate-500 mt-0.5">
                Resolved as “{conflict.resolution.value}” · {formatDateTime(conflict.resolution.at)}
              </p>
            )}
            {status === "dismissed" && conflict.resolution && (
              <p className="text-xs text-slate-500 mt-0.5">
                Dismissed: {conflict.resolution.reason} · {formatDateTime(conflict.resolution.at)}
              </p>
            )}
          </div>
        </div>
        {decided && interactive && handlers && (
          <button type="button" className={SECONDARY_BUTTON} disabled={disabled} onClick={handlers.reopen}>
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            Reopen
          </button>
        )}
      </div>

      <fieldset className="mt-3 space-y-2" disabled={!interactive || decided || disabled}>
        <legend className="sr-only">Values found for {conflictFieldLabel(conflict.field)}</legend>
        {groups.map((g) => {
          const chosen = decided ? conflict.resolution?.value === g.value : picked === g.value;
          return (
            <label
              key={g.value}
              className={`flex items-start gap-3 rounded-lg border bg-white dark:bg-[#111827] px-3 py-2 ${
                chosen ? "border-[#2563eb]" : "border-gray-200 dark:border-zinc-800"
              } ${interactive && !decided ? "cursor-pointer" : ""}`}
            >
              {interactive && !decided && (
                <input
                  type="radio"
                  name={`conflict-${conflict.field}`}
                  className="mt-1 text-[#2563eb] focus:ring-[#2563eb]"
                  checked={picked === g.value}
                  onChange={() => setPicked(g.value)}
                />
              )}
              <span className="min-w-0">
                <span className="block text-sm font-medium text-slate-900 dark:text-slate-100 break-words">
                  {g.value}
                </span>
                <span className="block text-xs text-slate-500">
                  {g.sources
                    .map((s) => {
                      const doc = bundle.documents.find((d) => d.documentId === s.documentId);
                      const name = doc ? documentLabel(doc) : "Removed document";
                      return s.typeKey ? `${slotLabel(bundle, s.typeKey)} · ${name}` : name;
                    })
                    .join(", ")}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      {interactive && !decided && handlers && (
        <div className="mt-3 space-y-2">
          {dismissing ? (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                Why can this difference be ignored?
                <textarea
                  className={`${INPUT_CLASS} mt-1`}
                  rows={2}
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="For example: the name is abbreviated on the PAN card."
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={SECONDARY_BUTTON}
                  disabled={disabled || reason.trim().length < 3}
                  onClick={() => handlers.dismiss(reason.trim())}
                >
                  {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Dismiss conflict
                </button>
                <button type="button" className="text-sm text-slate-500 px-2" onClick={() => setDismissing(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={PRIMARY_BUTTON}
                disabled={disabled || !picked}
                onClick={() => handlers.resolve(picked)}
              >
                {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                Use selected value
              </button>
              {canDismiss ? (
                <button type="button" className={SECONDARY_BUTTON} disabled={disabled} onClick={() => setDismissing(true)}>
                  Dismiss
                </button>
              ) : (
                <span className="text-xs text-slate-400">Only admins can dismiss a conflict.</span>
              )}
            </div>
          )}
        </div>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
