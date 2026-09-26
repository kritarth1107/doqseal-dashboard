import { AlertTriangle, CircleDashed, FileWarning, Loader2 } from "lucide-react";
import type { BundleProgress } from "@/lib/bundles/types";

/** Compact completeness and open-item counts for a case pack row. */
export function ProgressCell({ progress, documentCount }: { progress?: BundleProgress | null; documentCount?: number }) {
  if (!progress) {
    return <span className="text-xs text-slate-400">{documentCount ? `${documentCount} document(s)` : "No documents yet"}</span>;
  }
  const pct = progress.requiredSlots > 0 ? Math.round((progress.requiredSlotsMet / progress.requiredSlots) * 100) : 100;
  return (
    <div className="space-y-1.5 min-w-[9rem]">
      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
        <span>
          {progress.requiredSlotsMet}/{progress.requiredSlots} required
        </span>
        {typeof documentCount === "number" && <span className="text-slate-400">{documentCount} docs</span>}
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : "bg-[#2563eb]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
        {progress.inProgress > 0 && (
          <span className="inline-flex items-center gap-1 text-blue-600">
            <Loader2 className="w-3 h-3 animate-spin" /> {progress.inProgress} sorting
          </span>
        )}
        {progress.missing > 0 && (
          <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
            <CircleDashed className="w-3 h-3" /> {progress.missing} missing
          </span>
        )}
        {progress.openConflicts > 0 && (
          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-3 h-3" /> {progress.openConflicts} conflict{progress.openConflicts === 1 ? "" : "s"}
          </span>
        )}
        {progress.needsAttention > 0 && (
          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
            <FileWarning className="w-3 h-3" /> {progress.needsAttention} need a slot
          </span>
        )}
      </div>
    </div>
  );
}
