"use client";

import { Bot, User } from "lucide-react";
import { describeTimelineEntry } from "@/lib/bundles/derive";
import type { BundleDetail, TimelineEntry } from "@/lib/bundles/types";
import { formatDateTime, LoadingState } from "./ui";

export function Timeline({
  entries,
  phase,
  error,
  bundle,
}: {
  entries: TimelineEntry[];
  phase: "loading" | "ready" | "error";
  error: string | null;
  bundle: BundleDetail | null;
}) {
  if (phase === "loading") return <LoadingState label="Loading activity…" />;
  if (phase === "error") {
    return <p className="text-sm text-slate-500 py-6 text-center">{error || "Could not load activity."}</p>;
  }
  if (entries.length === 0) {
    return <p className="text-sm text-slate-500 py-6 text-center">No activity yet.</p>;
  }
  return (
    <ol className="relative border-l border-gray-200 dark:border-zinc-800 ml-2 space-y-4">
      {entries.map((e) => {
        const note = typeof e.details?.note === "string" ? e.details.note : null;
        const reason = typeof e.details?.reason === "string" ? e.details.reason : null;
        return (
          <li key={e.id} className="ml-4">
            <span className="absolute -left-[9px] mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-[#111827] border border-gray-200 dark:border-zinc-700">
              {e.actor.isSystem ? (
                <Bot className="w-2.5 h-2.5 text-slate-400" />
              ) : (
                <User className="w-2.5 h-2.5 text-slate-500" />
              )}
            </span>
            <p className="text-sm text-slate-800 dark:text-slate-100">{describeTimelineEntry(e, bundle)}</p>
            {(note || reason) && (
              <p className="text-xs text-slate-500 mt-0.5 italic">“{note || reason}”</p>
            )}
            <p className="text-xs text-slate-400 mt-0.5">
              {e.actor.isSystem ? "DoqSeal" : e.actor.name} · {formatDateTime(e.timestamp)}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
