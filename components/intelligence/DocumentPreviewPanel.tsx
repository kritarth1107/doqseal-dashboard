"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, FileText, Loader2, X } from "lucide-react";

export type PreviewDocument = {
  id: string;
  title: string;
  href: string;
};

type LoadedDoc = {
  id: string;
  mimeType: string;
  originalFilename: string;
  displayTitle?: string | null;
  filePurgedAt?: string | null;
};

export function DocumentPreviewPanel({
  doc,
  onClose,
}: {
  doc: PreviewDocument;
  onClose: () => void;
}) {
  const [loaded, setLoaded] = useState<LoadedDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoaded(null);
    setError(null);
    fetch(`/api/documents/${doc.id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not open this document");
        return data as LoadedDoc;
      })
      .then((data) => {
        if (!cancelled) setLoaded(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not open this document");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [doc.id]);

  const title = loaded?.displayTitle?.trim() || loaded?.originalFilename || doc.title;
  const fileUrl = `/api/documents/${doc.id}/file`;
  const mime = (loaded?.mimeType || "").toLowerCase();
  const isPdf = mime.includes("pdf");
  const isImage = mime.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp)$/i.test(mime);

  return (
    <aside className="hidden md:flex w-[min(560px,48vw)] shrink-0 flex-col h-full border-l border-gray-200 dark:border-white/10 bg-[#f3f4f6] dark:bg-[#0b1220]">
      <div className="shrink-0 flex items-center gap-2 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#111827] px-3 py-2.5">
        <FileText className="h-4 w-4 shrink-0 text-[#2563eb]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-slate-100">{title}</p>
          {loaded?.originalFilename && loaded.originalFilename !== title && (
            <p className="truncate text-[11px] text-gray-400">{loaded.originalFilename}</p>
          )}
        </div>
        <Link
          href={doc.href}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          Open
          <ExternalLink className="h-3 w-3" />
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          aria-label="Close document"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-4">
        {!loaded && !error && (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[#2563eb]" />
          </div>
        )}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {loaded?.filePurgedAt && (
          <p className="text-sm text-gray-500">
            The original file was removed. Extracted context is still available in chat.
          </p>
        )}
        {loaded && !loaded.filePurgedAt && isPdf && (
          <iframe
            src={`${fileUrl}#view=FitH`}
            title={title}
            className="h-full min-h-[70vh] w-full rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/10"
          />
        )}
        {loaded && !loaded.filePurgedAt && !isPdf && isImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fileUrl}
            alt={title}
            className="mx-auto max-w-full rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/10"
          />
        )}
        {loaded && !loaded.filePurgedAt && !isPdf && !isImage && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-white/10 dark:bg-[#111827] dark:text-slate-300">
            <p>This file type opens best in a new tab.</p>
            <a href={fileUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-[#2563eb] hover:underline">
              Open file
            </a>
          </div>
        )}
      </div>
    </aside>
  );
}
