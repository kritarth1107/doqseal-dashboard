"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, CircleDashed, FileText, Loader2, Lock, Plus, Trash2 } from "lucide-react";
import type { SlotView } from "@/lib/bundles/derive";
import { documentLabel } from "@/lib/bundles/derive";
import type { BundleDetail, BundleDocumentView } from "@/lib/bundles/types";
import { SlotPicker } from "./SlotPicker";

function slotBadge(view: SlotView) {
  if (view.required) return { text: "Required", cls: "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-300" };
  if (view.slot.conditional) return { text: "Depends on case", cls: "bg-slate-50 text-slate-500 dark:bg-zinc-900 dark:text-slate-400" };
  return { text: "Optional", cls: "bg-slate-50 text-slate-500 dark:bg-zinc-900 dark:text-slate-400" };
}

export function SlotCard({
  bundle,
  view,
  isPending,
  onAdd,
  onAssign,
  onRemove,
}: {
  bundle: BundleDetail;
  view: SlotView;
  isPending: (key: string) => boolean;
  onAdd: (slotKey: string) => void;
  onAssign: (documentId: string, typeKey: string) => void;
  onRemove: (doc: BundleDocumentView) => void;
}) {
  const badge = slotBadge(view);
  const border = view.missing
    ? "border-dashed border-slate-300 dark:border-zinc-700"
    : view.hasConflict
    ? "border-amber-300 dark:border-amber-800"
    : "border-gray-200 dark:border-zinc-800";

  return (
    <div className={`rounded-xl border ${border} bg-white dark:bg-[#111827] p-4 flex flex-col`} data-slot={view.slot.key}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{view.slot.label}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.text}</span>
            {view.missing && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300">
                <CircleDashed className="w-3 h-3" /> Missing
              </span>
            )}
            {view.hasConflict && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                <AlertTriangle className="w-3 h-3" /> Conflict
              </span>
            )}
            {!view.missing && view.received > 0 && !view.hasConflict && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" aria-label="Received" />
            )}
            {view.overLimit && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                More than {view.slot.maxCount}
              </span>
            )}
          </div>
        </div>
        {!bundle.readOnly && (
          <button
            type="button"
            onClick={() => onAdd(view.slot.key)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-[#2563eb] hover:bg-blue-50 dark:hover:bg-zinc-800"
            aria-label={`Add a document to ${view.slot.label}`}
            title="Add document"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {view.documents.length === 0 ? (
        <p className="text-xs text-slate-400 mt-3">
          {view.missing ? "Nothing received yet." : "No document in this slot."}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {view.documents.map((doc) => {
            const moving = isPending(`slot:${doc.documentId}`);
            const removing = isPending(`remove:${doc.documentId}`);
            return (
              <li key={doc.documentId} className="rounded-lg bg-slate-50 dark:bg-zinc-900/60 px-2.5 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  {doc.restricted ? (
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  {doc.available && !doc.restricted ? (
                    <Link href={`/drive/${doc.documentId}`} className="text-sm text-slate-800 dark:text-slate-100 truncate hover:text-[#2563eb]">
                      {documentLabel(doc)}
                    </Link>
                  ) : (
                    <span className="text-sm text-slate-500 truncate">{documentLabel(doc)}</span>
                  )}
                  {(moving || removing) && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 shrink-0" />}
                  {doc.assignedBy === "auto" && (
                    <span className="ml-auto text-[10px] text-slate-400 shrink-0" title="Placed by automatic sorting">
                      auto
                    </span>
                  )}
                </div>
                {!bundle.readOnly && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 min-w-0">
                      <SlotPicker
                        compact
                        bundle={bundle}
                        doc={doc}
                        pending={moving}
                        onAssign={(key) => onAssign(doc.documentId, key)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(doc)}
                      disabled={removing}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-zinc-800 disabled:opacity-50"
                      aria-label={`Remove ${documentLabel(doc)} from this pack`}
                      title="Remove from pack"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
