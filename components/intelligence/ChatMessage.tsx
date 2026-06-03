"use client";

import Link from "next/link";
import { Bot, ExternalLink, FileText, User } from "lucide-react";
import { ChatMarkdown } from "./ChatMarkdown";

type DocRef = {
  id: string;
  patientName: string;
  filename: string;
  status: string;
  href: string;
};

export function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end gap-3">
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#2563eb] px-4 py-3 text-[15px] leading-relaxed text-white shadow-sm">
        {content}
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600">
        <User className="h-4 w-4" />
      </div>
    </div>
  );
}

export function AssistantMessage({
  content,
  documents,
}: {
  content: string;
  documents?: DocRef[];
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2563eb] shadow-sm">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 flex-1 max-w-[92%]">
        <div className="rounded-2xl rounded-tl-md bg-white px-4 py-3.5 shadow-sm border border-gray-100">
          <ChatMarkdown content={content} />
          {documents && documents.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Source documents
              </p>
              {documents.map((doc) => (
                <Link
                  key={doc.id}
                  href={doc.href}
                  className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-3 transition-all hover:border-[#2563eb]/30 hover:bg-[#2563eb]/5"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200 group-hover:border-[#2563eb]/20">
                    <FileText className="h-4 w-4 text-[#2563eb]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.patientName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{doc.filename}</p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-gray-400 group-hover:text-[#2563eb] shrink-0" />
                </Link>
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
      <div className="rounded-2xl rounded-tl-md bg-white px-4 py-3.5 shadow-sm border border-gray-100">
        <div className="flex gap-1.5 items-center h-5">
          <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
          <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
          <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
