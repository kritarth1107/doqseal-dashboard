"use client";

import { useState } from "react";
import { AlertCircle, Bot, Check, ChevronDown, FileText, Info, Loader2, User } from "lucide-react";
import type { ChatCitation, ChatStep } from "@/lib/chat-stream";
import { ChatMarkdown } from "./ChatMarkdown";

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

/** Static list of steps returned by the non-streaming endpoint. */
export function ThinkingTrace({
  steps,
  defaultOpen = false,
}: {
  steps: ThinkingStep[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <span>Thought process</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ol className="mt-2 space-y-2 border-l border-gray-200 pl-3 dark:border-white/10">
          {steps.map((step, index) => (
            <li key={`${step.title}-${index}`}>
              <p className="text-[13px] font-medium text-gray-800 dark:text-slate-100">{step.title}</p>
              {step.detail && (
                <p className="text-[12px] leading-relaxed text-gray-500 dark:text-slate-400">{step.detail}</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function stepDetail(step: ChatStep): string | null {
  const detail = step.detail as { chunks?: number; documents?: number; titles?: string[]; citations?: number } | null | undefined;
  if (!detail || step.status !== "done") return null;
  const parts: string[] = [];
  if (typeof detail.documents === "number") {
    parts.push(`${detail.documents} document${detail.documents === 1 ? "" : "s"}`);
  }
  if (typeof detail.chunks === "number") {
    parts.push(`${detail.chunks} passage${detail.chunks === 1 ? "" : "s"}`);
  }
  if (typeof detail.citations === "number") {
    parts.push(`${detail.citations} citation${detail.citations === 1 ? "" : "s"}`);
  }
  const titles = Array.isArray(detail.titles) ? detail.titles.slice(0, 3).join(", ") : "";
  return [parts.join(" · "), titles].filter(Boolean).join(" — ") || null;
}

/** Steps as they actually happen on the server. Open while running, collapsed afterwards. */
export function LiveStepTrace({ steps, live }: { steps: ChatStep[]; live: boolean }) {
  const [toggled, setToggled] = useState<boolean | null>(null);
  const open = toggled ?? live;
  if (steps.length === 0) return null;

  return (
    <div className="mb-3" data-testid="step-trace">
      <button
        type="button"
        onClick={() => setToggled(!open)}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <span className={live ? "animate-pulse" : ""}>{live ? "Working" : "Steps"}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ol className="mt-2 space-y-1.5 border-l border-gray-200 pl-3 dark:border-white/10">
          {steps.map((step) => {
            const detail = stepDetail(step);
            return (
              <li key={step.id || step.name} className="flex items-start gap-2">
                {step.status === "done" ? (
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                ) : (
                  <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-[#2563eb]" />
                )}
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-gray-800 dark:text-slate-100">{step.label}</p>
                  {detail && (
                    <p className="truncate text-[12px] text-gray-500 dark:text-slate-400">{detail}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function CitationList({
  citations,
  activeDocumentId,
  onOpenCitation,
}: {
  citations: ChatCitation[];
  activeDocumentId?: string | null;
  onOpenCitation?: (citation: ChatCitation) => void;
}) {
  return (
    <div className="mt-4 space-y-2" data-testid="citations">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Sources</p>
      <ol className="space-y-1.5">
        {citations.map((citation) => (
          <li key={citation.n}>
            <button
              type="button"
              onClick={() => onOpenCitation?.(citation)}
              className={`flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${
                activeDocumentId === citation.documentId
                  ? "border-[#2563eb]/40 bg-[#2563eb]/5"
                  : "border-gray-200 hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
              }`}
            >
              <span className="mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded bg-[#2563eb]/10 px-1 text-[11px] font-semibold text-[#2563eb]">
                {citation.n}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[13px] font-medium text-gray-900 dark:text-slate-100">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span className="truncate">{citation.title || "Document"}</span>
                  {citation.page ? <span className="shrink-0 text-gray-400">p. {citation.page}</span> : null}
                </span>
                {citation.quote && (
                  <span className="mt-0.5 line-clamp-2 block text-[12px] text-gray-500 dark:text-slate-400">
                    “{citation.quote}”
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ol>
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
export function AssistantMessage({
  content,
  documents,
  thinking,
  thinkingOpen = false,
  steps,
  citations,
  mode,
  streaming = false,
  activeDocumentId,
  onOpenDocument,
  onOpenCitation,
}: {
  content: string;
  documents?: DocRef[];
  thinking?: ThinkingStep[];
  thinkingOpen?: boolean;
  steps?: ChatStep[];
  citations?: ChatCitation[];
  mode?: string | null;
  streaming?: boolean;
  activeDocumentId?: string | null;
  onOpenDocument?: (doc: DocRef) => void;
  onOpenCitation?: (citation: ChatCitation) => void;
}) {
  const hasDocuments = Boolean(documents && documents.length > 0);
  const answer = hasDocuments ? proseWithoutTable(content) : content;
  const declined = mode === "declined";
  const failed = mode === "error";

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2563eb] shadow-sm">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 flex-1 max-w-[92%] pt-1">
        {steps && steps.length > 0 ? (
          <LiveStepTrace steps={steps} live={streaming} />
        ) : (
          thinking && thinking.length > 0 && <ThinkingTrace steps={thinking} defaultOpen={thinkingOpen} />
        )}
        {streaming && !answer && (!steps || steps.length === 0) && (
          <div className="flex items-center gap-2 text-[13px] text-gray-500 dark:text-slate-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2563eb]" />
            Starting…
          </div>
        )}
        {answer && (declined || failed) ? (
          <div
            data-testid={declined ? "decline" : "chat-error"}
            className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[14px] leading-relaxed ${
              failed
                ? "border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
                : "border-gray-200 bg-gray-50 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
            }`}
          >
            {failed ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <Info className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{answer}</span>
          </div>
        ) : (
          answer && (
            <div className="text-[15px] leading-relaxed text-gray-900 dark:text-slate-100">
              <ChatMarkdown content={answer} />
              {streaming && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-gray-400 align-middle" />}
            </div>
          )
        )}
        {mode === "aborted" && !streaming && (
          <p className="mt-2 text-[12px] text-gray-400">Stopped.</p>
        )}
        {citations && citations.length > 0 && !declined && (
          <CitationList citations={citations} activeDocumentId={activeDocumentId} onOpenCitation={onOpenCitation} />
        )}
        {hasDocuments && (
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
