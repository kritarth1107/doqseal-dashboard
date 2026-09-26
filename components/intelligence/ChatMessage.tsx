"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, ChevronDown, FileText, User, AlertCircle } from "lucide-react";
import { ChatMarkdown } from "./ChatMarkdown";
import type { StoredCitation, StoredStep } from "@/lib/chat-history";

type DocRef = {
  id: string;
  patientName: string;
  filename: string;
  kind?: string;
  fileName?: string;
  status: string;
  href: string;
};

export type ThinkingStep = {
  title: string;
  detail?: string;
};

export function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end gap-3">
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#2563eb] px-4 py-3 text-[15px] leading-relaxed text-white shadow-sm">
        {content}
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-slate-300">
        <User className="h-4 w-4" />
      </div>
    </div>
  );
}

export function LiveStepTrace({
  steps,
  activeStepId,
  collapsed = false,
  onToggle,
}: {
  steps: Array<{ id: string; name: string; label: string; status?: string; detail?: Record<string, unknown> }>;
  activeStepId: string | null;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const activeRef = useRef<HTMLLIElement>(null);
  const isActive = steps.some((s) => s.status === "started");

  useEffect(() => {
    if (!collapsed && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [steps.length, collapsed]);

  if (steps.length === 0) return null;

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
      >
        {isActive && (
          <span className="relative flex h-2 w-2 mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2563eb] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2563eb]" />
          </span>
        )}
        <span className={isActive ? "animate-pulse" : ""}>
          {isActive ? "Thinking" : "Thought process"}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${collapsed ? "" : "rotate-180"}`}
        />
      </button>
      {!collapsed && (
        <ol className="mt-2 space-y-2 border-l border-gray-200 pl-3 dark:border-white/10">
          {steps.map((step, index) => {
            const isStepActive = step.id === activeStepId && step.status === "started";
            return (
              <li
                key={step.id}
                ref={index === steps.length - 1 ? activeRef : undefined}
                className="animate-in fade-in slide-in-from-left-2 duration-300"
              >
                <div className="flex items-center gap-2">
                  {isStepActive && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2563eb] opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#2563eb]" />
                    </span>
                  )}
                  {!isStepActive && step.status === "done" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  )}
                  <p className={`text-[13px] font-medium ${isStepActive ? "text-[#2563eb]" : "text-gray-800 dark:text-slate-100"}`}>
                    {step.label}
                  </p>
                </div>
                {step.detail && (
                  <p className="text-[12px] leading-relaxed text-gray-500 dark:text-slate-400 ml-3.5">
                    {typeof step.detail.documents === "number" && `${step.detail.documents} documents`}
                    {typeof step.detail.chunks === "number" && `, ${step.detail.chunks} chunks`}
                    {Array.isArray(step.detail.titles) && step.detail.titles.length > 0 && (
                      <span className="block truncate">
                        {(step.detail.titles as string[]).slice(0, 3).join(", ")}
                        {(step.detail.titles as string[]).length > 3 && "…"}
                      </span>
                    )}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export function ThinkingTrace({
  steps,
  live = false,
  defaultOpen = false,
}: {
  steps: ThinkingStep[];
  live?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || live);
  const [shown, setShown] = useState(live ? 1 : steps.length);
  const stepRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!live) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Pre-existing: sync state with props
      setShown(steps.length);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Pre-existing: sync state with props
      setOpen(defaultOpen);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Pre-existing: initialize animation
    setOpen(true);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Pre-existing: initialize animation
    setShown(1);
    const timer = window.setInterval(() => {
      setShown((count) => (count >= steps.length ? count : count + 1));
    }, 700);
    return () => window.clearInterval(timer);
  }, [live, steps.length, defaultOpen]);

  useEffect(() => {
    if (!live || shown < steps.length) return;
    const timer = window.setTimeout(() => setOpen(false), 700);
    return () => window.clearTimeout(timer);
  }, [live, shown, steps.length]);

  useEffect(() => {
    if (!open) return;
    stepRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [shown, open]);

  const visible = steps.slice(0, shown);

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <span className={live ? "animate-pulse" : ""}>
          {live ? "Thinking" : "Thought process"}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ol className="mt-2 space-y-2 border-l border-gray-200 pl-3 dark:border-white/10">
          {visible.map((step, index) => (
            <li
              key={`${step.title}-${index}`}
              ref={index === visible.length - 1 ? stepRef : undefined}
              className="animate-in fade-in duration-300"
            >
              <p className="text-[13px] font-medium text-gray-800 dark:text-slate-100">
                {step.title}
              </p>
              {step.detail && (
                <p className="text-[12px] leading-relaxed text-gray-500 dark:text-slate-400">
                  {step.detail}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function proseWithoutTable(content: string): string {
  const lines = content.split("\n");
  const kept: string[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index]?.trim() ?? "";
    const next = lines[index + 1]?.trim() ?? "";
    if (line.startsWith("|") && line.endsWith("|") && /^\|[\s\-:|]+\|$/.test(next)) {
      index += 2;
      while (index < lines.length && (lines[index]?.trim() ?? "").startsWith("|")) {
        index += 1;
      }
      continue;
    }
    kept.push(lines[index] ?? "");
    index += 1;
  }
  return kept.join("\n").trim();
}

function DocumentTable({
  documents,
  activeDocumentId,
  onOpenDocument,
}: {
  documents: DocRef[];
  activeDocumentId?: string | null;
  onOpenDocument?: (doc: DocRef) => void;
}) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-white/10">
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              #
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Document
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Type
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              File
            </th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc, index) => {
            const typeLabel = doc.kind || doc.filename || "Document";
            const fileLabel = doc.fileName || "—";
            const active = activeDocumentId === doc.id;
            return (
              <tr
                key={doc.id}
                onClick={() => onOpenDocument?.(doc)}
                className={`cursor-pointer border-b border-gray-100 last:border-0 dark:border-white/10 ${
                  active ? "bg-[#2563eb]/5" : "hover:bg-[#2563eb]/5"
                }`}
              >
                <td className="px-3 py-2.5 text-gray-400">{index + 1}</td>
                <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-slate-100">
                  {doc.patientName}
                </td>
                <td className="px-3 py-2.5 capitalize text-gray-600 dark:text-slate-300">
                  {typeLabel}
                </td>
                <td className="px-3 py-2.5 text-gray-500 dark:text-slate-400">{fileLabel}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function CitationChips({
  citations,
  onOpenCitation,
}: {
  citations: StoredCitation[];
  onOpenCitation?: (citation: StoredCitation) => void;
}) {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {citations.map((citation) => (
        <button
          key={`${citation.documentId}-${citation.n}`}
          type="button"
          onClick={() => onOpenCitation?.(citation)}
          className="group relative inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:border-[#2563eb]/30 hover:bg-[#2563eb]/5 hover:text-[#2563eb] dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-[#2563eb]/30 dark:hover:text-[#2563eb]"
          title={citation.quote}
        >
          <FileText className="h-3.5 w-3.5 text-gray-400 group-hover:text-[#2563eb]" />
          <span className="max-w-[180px] truncate">{citation.title}</span>
          {citation.page !== null && (
            <span className="text-gray-400 group-hover:text-[#2563eb]/70">
              p.{citation.page}
            </span>
          )}
          <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-2.5 text-xs text-gray-600 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300">
            <p className="line-clamp-3 italic">&ldquo;{citation.quote}&rdquo;</p>
          </div>
        </button>
      ))}
    </div>
  );
}

export function DeclineMessage({ message }: { message: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 shadow-sm dark:bg-amber-900/30">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="min-w-0 flex-1 max-w-[92%] pt-1">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/30 dark:bg-amber-900/10">
          <p className="text-[15px] leading-relaxed text-amber-900 dark:text-amber-100">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

export function StreamingMessage({
  content,
  steps,
  activeStepId,
  citations,
  isComplete,
  onOpenCitation,
}: {
  content: string;
  steps: StoredStep[];
  activeStepId: string | null;
  citations: StoredCitation[];
  isComplete: boolean;
  onOpenCitation?: (citation: StoredCitation) => void;
}) {
  const [stepsCollapsed, setStepsCollapsed] = useState(false);

  useEffect(() => {
    if (isComplete && steps.length > 0) {
      const timer = setTimeout(() => setStepsCollapsed(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isComplete, steps.length]);

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2563eb] shadow-sm">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 flex-1 max-w-[92%] pt-1">
        {steps.length > 0 && (
          <LiveStepTrace
            steps={steps}
            activeStepId={activeStepId}
            collapsed={stepsCollapsed}
            onToggle={() => setStepsCollapsed((v) => !v)}
          />
        )}
        {content && (
          <div className="text-[15px] leading-relaxed text-gray-900 dark:text-slate-100">
            <ChatMarkdown content={content} />
            {!isComplete && (
              <span className="inline-block w-2 h-4 ml-0.5 bg-gray-400 dark:bg-slate-500 animate-pulse rounded-sm" />
            )}
          </div>
        )}
        {citations.length > 0 && (
          <CitationChips citations={citations} onOpenCitation={onOpenCitation} />
        )}
      </div>
    </div>
  );
}

export function AssistantMessage({
  content,
  documents,
  thinking,
  steps,
  citations,
  thinkingOpen = false,
  activeDocumentId,
  onOpenDocument,
  onOpenCitation,
}: {
  content: string;
  documents?: DocRef[];
  thinking?: ThinkingStep[];
  steps?: StoredStep[];
  citations?: StoredCitation[];
  thinkingOpen?: boolean;
  activeDocumentId?: string | null;
  onOpenDocument?: (doc: DocRef) => void;
  onOpenCitation?: (citation: StoredCitation) => void;
}) {
  const hasDocuments = Boolean(documents && documents.length > 0);
  const hasCitations = Boolean(citations && citations.length > 0);
  const answer = hasDocuments ? proseWithoutTable(content) : content;

  const displaySteps = steps && steps.length > 0 ? steps : undefined;

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2563eb] shadow-sm">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 flex-1 max-w-[92%] pt-1">
        {displaySteps && displaySteps.length > 0 && (
          <ThinkingTrace
            steps={displaySteps.map((s) => ({
              title: s.label,
              detail: s.detail ? JSON.stringify(s.detail).slice(0, 100) : undefined,
            }))}
            defaultOpen={thinkingOpen}
          />
        )}
        {!displaySteps && thinking && thinking.length > 0 && (
          <ThinkingTrace steps={thinking} defaultOpen={thinkingOpen} />
        )}
        {answer && (
          <div className="text-[15px] leading-relaxed text-gray-900 dark:text-slate-100">
            <ChatMarkdown content={answer} />
          </div>
        )}
        {hasCitations && (
          <CitationChips citations={citations!} onOpenCitation={onOpenCitation} />
        )}
        {hasDocuments && !hasCitations && (
          <DocumentTable
            documents={documents ?? []}
            activeDocumentId={activeDocumentId}
            onOpenDocument={onOpenDocument}
          />
        )}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2563eb]">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 flex-1 max-w-[92%] pt-1">
        <div className="flex items-center gap-2 text-[13px] text-gray-500 dark:text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2563eb] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2563eb]" />
          </span>
          <span className="animate-pulse">Thinking…</span>
        </div>
      </div>
    </div>
  );
}
