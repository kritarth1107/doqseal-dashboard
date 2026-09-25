"use client";

import { useEffect, useState } from "react";
import { Bot, ChevronDown, ExternalLink, FileText, User } from "lucide-react";
import { ChatMarkdown } from "./ChatMarkdown";

type DocRef = {
  id: string;
  patientName: string;
  filename: string;
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

  useEffect(() => {
    if (!live) {
      setShown(steps.length);
      return;
    }
    setShown(1);
    const timer = window.setInterval(() => {
      setShown((count) => (count >= steps.length ? count : count + 1));
    }, 700);
    return () => window.clearInterval(timer);
  }, [live, steps.length]);

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
            <li key={`${step.title}-${index}`} className="animate-in fade-in duration-300">
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
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2563eb] shadow-sm">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 flex-1 max-w-[92%]">
        <div className="rounded-2xl rounded-tl-md bg-white px-4 py-3.5 shadow-sm border border-gray-100 dark:bg-[#111827] dark:border-white/10">
          {thinking && thinking.length > 0 && (
            <ThinkingTrace steps={thinking} defaultOpen={thinkingOpen} />
          )}
          <ChatMarkdown content={content} />
          {documents && documents.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Source documents
              </p>
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => onOpenDocument?.(doc)}
                  className={`group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                    activeDocumentId === doc.id
                      ? "border-[#2563eb]/40 bg-[#2563eb]/5"
                      : "border-gray-200 bg-gray-50/80 hover:border-[#2563eb]/30 hover:bg-[#2563eb]/5 dark:border-white/10 dark:bg-white/5"
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200 group-hover:border-[#2563eb]/20 dark:bg-[#0b1220] dark:border-white/10">
                    <FileText className="h-4 w-4 text-[#2563eb]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                      {doc.patientName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{doc.filename}</p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-gray-400 group-hover:text-[#2563eb] shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
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
      <div className="min-w-0 flex-1 max-w-[92%] rounded-2xl rounded-tl-md bg-white px-4 py-3.5 shadow-sm border border-gray-100 dark:bg-[#111827] dark:border-white/10">
        <ThinkingTrace steps={LIVE_STEPS} live defaultOpen />
      </div>
    </div>
  );
}
