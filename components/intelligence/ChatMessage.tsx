"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, ChevronDown, User } from "lucide-react";
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
      setShown(steps.length);
      setOpen(defaultOpen);
      return;
    }
    setOpen(true);
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
const LIVE_STEPS: ThinkingStep[] = [
  { title: "Read the question", detail: "Figuring out whether this is a count, a list, or a lookup." },
  { title: "Open Drive", detail: "Loading the documents you can see in this organisation." },
  { title: "Classify each file", detail: "Separating prescriptions from invoices, notes, and other files." },
  { title: "Match only what was asked", detail: "Invoices and notes stay out of a prescription count." },
  { title: "Write the answer", detail: "Using the classified list, not a guess." },
];

export function AssistantMessage({
  content,
  documents,
  thinking,
  thinkingOpen = false,
  activeDocumentId,
  onOpenDocument,
}: {
  content: string;
  documents?: DocRef[];
  thinking?: ThinkingStep[];
  thinkingOpen?: boolean;
  activeDocumentId?: string | null;
  onOpenDocument?: (doc: DocRef) => void;
}) {
  const hasDocuments = Boolean(documents && documents.length > 0);
  const answer = hasDocuments ? proseWithoutTable(content) : content;

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2563eb] shadow-sm">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 flex-1 max-w-[92%] pt-1">
        {thinking && thinking.length > 0 && (
          <ThinkingTrace steps={thinking} defaultOpen={thinkingOpen} />
        )}
        {answer && (
          <div className="text-[15px] leading-relaxed text-gray-900 dark:text-slate-100">
            <ChatMarkdown content={answer} />
          </div>
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

export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2563eb]">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 flex-1 max-w-[92%]">
        <ThinkingTrace steps={LIVE_STEPS} live defaultOpen />
      </div>
    </div>
  );
}
