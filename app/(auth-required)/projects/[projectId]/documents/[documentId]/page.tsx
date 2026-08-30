"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ExtractionFields } from "@/components/ExtractionFields";
import { useAuth } from "@/components/AuthProvider";
import { withOrgHeaders } from "@/lib/client-api";
import { StoredDocument } from "@/types/extraction";

function StatusBadge({ status }: { status: string }) {
  if (status === "processing") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
        <Loader2 className="h-3 w-3 animate-spin" />
        Processing
      </span>
    );
  }
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
        <CheckCircle2 className="h-3 w-3" />
        Completed
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20">
        <XCircle className="h-3 w-3" />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-slate-300 capitalize">
      {status.replace("_", " ")}
    </span>
  );
}

type PageTab = { page: number; title: string };

function derivePageTabs(
  extracted: Record<string, unknown> | null,
  _filename: string
): PageTab[] {
  const pages = extracted?.pages;
  if (Array.isArray(pages) && pages.length > 0) {
    return pages
      .map((entry, index) => {
        if (!entry || typeof entry !== "object") return null;
        const row = entry as Record<string, unknown>;
        const pageNum =
          typeof row.page === "number"
            ? row.page
            : Number(row.page) || index + 1;
        const title =
          typeof row.title === "string" && row.title.trim()
            ? row.title.trim()
            : `Page ${pageNum}`;
        return { page: pageNum, title };
      })
      .filter((tab): tab is PageTab => Boolean(tab));
  }

  return [
    { page: 1, title: "Page 1" },
    { page: 2, title: "Page 2" },
  ];
}

function asExtractionRecord(
  extracted: StoredDocument["extractedJson"]
): Record<string, unknown> | null {
  if (!extracted || typeof extracted !== "object") return null;
  return extracted as Record<string, unknown>;
}

export default function ProjectDocumentPage() {
  const params = useParams<{ projectId: string; documentId: string }>();
  const router = useRouter();
  const { activeOrgId } = useAuth();
  const [doc, setDoc] = useState<StoredDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const [pdfPage, setPdfPage] = useState(1);

  async function loadDocument(silent = false) {
    if (!activeOrgId) return null;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(
        `/api/projects/${params.projectId}/documents/${params.documentId}`,
        withOrgHeaders(activeOrgId)
      );
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as StoredDocument;
      setDoc(data);
      return data;
    } catch {
      setDoc(null);
      return null;
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    if (!params.documentId) return;
    loadDocument();
  }, [params.documentId, params.projectId, activeOrgId]);

  useEffect(() => {
    if (!doc || doc.status !== "processing") return;
    const interval = setInterval(async () => {
      await loadDocument(true);
    }, 2000);
    return () => clearInterval(interval);
  }, [doc?.status, params.documentId, params.projectId, activeOrgId]);

  const extracted = useMemo(
    () => asExtractionRecord(doc?.extractedJson ?? null),
    [doc?.extractedJson]
  );

  const pageTabs = useMemo(
    () =>
      doc
        ? derivePageTabs(extracted, doc.originalFilename)
        : [{ page: 1, title: "Page 1" }],
    [doc, extracted]
  );

  useEffect(() => {
    if (!pageTabs.some((tab) => tab.page === pdfPage)) {
      setPdfPage(pageTabs[0]?.page ?? 1);
    }
  }, [pageTabs, pdfPage]);

  const handleReprocess = async () => {
    if (!doc || !activeOrgId) return;
    setReprocessing(true);
    try {
      const res = await fetch(
        `/api/documents/${doc.id}/reprocess`,
        withOrgHeaders(activeOrgId, { method: "POST" })
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reprocess failed");
      toast.success("Re-extraction queued");
      setDoc((prev) =>
        prev ? { ...prev, status: "processing", extractedJson: prev.extractedJson } : prev
      );
      await loadDocument(true);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Reprocess failed");
    } finally {
      setReprocessing(false);
    }
  };

  const handleDelete = async () => {
    if (!doc) return;
    if (
      !confirm(
        `Remove "${doc.displayTitle?.trim() || doc.originalFilename}"?\n\nThe original file will be deleted from storage. Extracted context stays available for AI chat.`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(
        `/api/projects/${params.projectId}/documents/${params.documentId}`,
        withOrgHeaders(activeOrgId, { method: "DELETE" })
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");

      toast.success("File removed — context retained");
      router.push(`/projects/${params.projectId}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="h-6 w-6 animate-spin text-[#2563eb]" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f8fafc] gap-3">
        <p className="text-sm text-gray-600 dark:text-slate-400">Document not found</p>
        <Link
          href={`/projects/${params.projectId}`}
          className="text-sm text-[#2563eb] hover:underline"
        >
          Back to project
        </Link>
      </div>
    );
  }

  const fileUrl = `/api/documents/${doc.id}/file`;
  const documentType =
    typeof extracted?.suggested_title === "string"
      ? extracted.suggested_title
      : typeof extracted?.summary === "string"
        ? extracted.summary.split(".")[0]
        : null;
  const hasFields =
    extracted &&
    Object.values(extracted).some(
      (value) => value !== null && value !== undefined && value !== ""
    );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f8fafc]">
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 pt-16 sm:pt-20">
        <div className="max-w-6xl mx-auto">
          <Link
            href={`/projects/${params.projectId}`}
            className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to project
          </Link>

          {doc.status === "processing" && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-[#2563eb]/20 bg-[#2563eb]/5 px-4 py-3 text-sm text-[#2563eb]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Identifying document and extracting pointers — usually a few seconds…
            </div>
          )}

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-slate-50">
                  {doc.displayTitle?.trim() || doc.originalFilename}
                </h1>
                <StatusBadge status={doc.status} />
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                {doc.displayTitle?.trim() &&
                doc.displayTitle.trim() !== doc.originalFilename ? (
                  <>
                    Original file: {doc.originalFilename}
                    {" · "}
                  </>
                ) : null}
                Uploaded {new Date(doc.uploadedAt).toLocaleString()}
                {documentType && <> · {documentType}</>}
                {doc.confidence > 0 && (
                  <> · {(doc.confidence * 100).toFixed(0)}% confidence</>
                )}
                {doc.extractionStrategy && (
                  <>
                    {" "}
                    ·{" "}
                    {["backend", "hybrid", "ocr", "ocr_fallback"].includes(
                      doc.extractionStrategy
                    )
                      ? "Real AI extraction"
                      : doc.extractionStrategy}
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReprocess}
                disabled={reprocessing || deleting || doc.status === "processing"}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                {reprocessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Re-run extraction
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || reprocessing}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white dark:bg-[#111827] border border-red-200 dark:border-red-500/30 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden sticky top-24">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 px-4 py-3 text-sm">
                  <span className="text-gray-500 dark:text-slate-400">Preview</span>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#2563eb] hover:underline"
                  >
                    Open in new tab
                  </a>
                </div>
                {doc.mimeType.includes("pdf") && (
                  <div className="flex flex-wrap gap-1 border-b border-gray-100 dark:border-white/10 px-4 py-2">
                    {pageTabs.map((tab) => (
                      <button
                        key={`${tab.page}-${tab.title}`}
                        type="button"
                        onClick={() => setPdfPage(tab.page)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          pdfPage === tab.page
                            ? "bg-[#2563eb] text-white"
                            : "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        Page {tab.page}
                        {tab.title && tab.title !== `Page ${tab.page}`
                          ? ` · ${tab.title}`
                          : ""}
                      </button>
                    ))}
                  </div>
                )}
                <div className="p-4">
                  {doc.mimeType.includes("pdf") ? (
                    <div
                      className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-900"
                      style={{ height: "480px" }}
                    >
                      <iframe
                        src={`${fileUrl}#page=${pdfPage}&view=FitH`}
                        className="h-full w-full"
                        title={`PDF preview page ${pdfPage}`}
                        key={pdfPage}
                      />
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fileUrl}
                      alt="Document preview"
                      className="w-full rounded-xl border border-gray-200 dark:border-white/10"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-4">
              {hasFields ? (
                <ExtractionFields
                  data={extracted!}
                  fieldConfidence={doc.fieldConfidence}
                />
              ) : (
                <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-2xl p-8 text-center text-sm text-gray-500 dark:text-slate-400">
                  {doc.status === "processing"
                    ? "Extraction in progress…"
                    : doc.status === "failed"
                      ? doc.processingError || "Extraction failed."
                      : "No extracted data available. Re-upload or re-run extraction after the worker is updated."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
