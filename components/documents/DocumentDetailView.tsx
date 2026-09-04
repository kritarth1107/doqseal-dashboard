"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Braces,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
  Webhook,
  XCircle,
  Pencil,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { ExtractionFields } from "@/components/ExtractionFields";
import { useAuth } from "@/components/AuthProvider";
import { withOrgHeaders } from "@/lib/client-api";
import { buildWebhookPayloadPreview } from "@/lib/document-api";
import { resolveMediaUrl } from "@/lib/media-url";
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

type DetailTab = "extraction" | "json" | "activity";

type TimelineActor = {
  userId: string;
  name: string;
  email?: string | null;
  avatar?: string | null;
  isSystem?: boolean;
};

type TimelineEvent = {
  action: string;
  actorId: string;
  actor?: TimelineActor | null;
  resourceType: string;
  metadata?: Record<string, unknown> | null;
  timestamp: string;
};

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimelineAction(action: string): string {
  const labels: Record<string, string> = {
    "document.upload": "Document uploaded",
    "document.delete": "File removed from storage",
    "document.reprocess": "Re-extraction queued",
    "document.file_ttl_purge": "File purged (TTL expired)",
    "extraction.fields_corrected": "Extraction fields corrected",
    "webhook.dispatched": "Webhook delivered",
    "webhook.failed": "Webhook delivery failed",
  };
  return labels[action] || action.replace(/\./g, " ");
}

function describeTimelineEvent(event: TimelineEvent): string | null {
  const meta = event.metadata || {};
  if (event.action === "webhook.dispatched" || event.action === "webhook.failed") {
    const url = typeof meta.url === "string" ? meta.url : "endpoint";
    const evt = typeof meta.event === "string" ? meta.event : "event";
    const code =
      typeof meta.statusCode === "number" ? ` · HTTP ${meta.statusCode}` : "";
    const err = typeof meta.error === "string" ? ` · ${meta.error}` : "";
    return `${evt} → ${url}${code}${err}`;
  }
  if (event.action === "document.upload") {
    const days =
      typeof meta.retentionDays === "number"
        ? `${meta.retentionDays} day retention`
        : meta.keepForever
          ? "Keep forever"
          : null;
    return days;
  }
  if (event.action === "document.reprocess" && meta.hasUserContext) {
    return "Included user context";
  }
  if (typeof meta.error === "string") return meta.error;
  return null;
}

function timelineStyle(action: string): {
  icon: typeof Upload;
  ring: string;
  bg: string;
} {
  if (action === "document.upload") {
    return {
      icon: Upload,
      ring: "ring-blue-200 dark:ring-blue-500/30",
      bg: "bg-blue-500 text-white",
    };
  }
  if (action === "document.reprocess") {
    return {
      icon: RefreshCw,
      ring: "ring-sky-200 dark:ring-sky-500/30",
      bg: "bg-sky-500 text-white",
    };
  }
  if (action.startsWith("extraction.")) {
    return {
      icon: Pencil,
      ring: "ring-amber-200 dark:ring-amber-500/30",
      bg: "bg-amber-500 text-white",
    };
  }
  if (action === "webhook.failed") {
    return {
      icon: XCircle,
      ring: "ring-red-200 dark:ring-red-500/30",
      bg: "bg-red-500 text-white",
    };
  }
  if (action.startsWith("webhook.")) {
    return {
      icon: Webhook,
      ring: "ring-violet-200 dark:ring-violet-500/30",
      bg: "bg-violet-500 text-white",
    };
  }
  if (action.includes("purge") || action.includes("delete")) {
    return {
      icon: Trash2,
      ring: "ring-orange-200 dark:ring-orange-500/30",
      bg: "bg-orange-500 text-white",
    };
  }
  return {
    icon: Shield,
    ring: "ring-zinc-200 dark:ring-zinc-600",
    bg: "bg-zinc-500 text-white",
  };
}

function UserChip({
  name,
  avatar,
  subtitle,
}: {
  name: string;
  avatar?: string | null;
  subtitle?: string | null;
}) {
  const src = resolveMediaUrl(avatar);
  const initials =
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";
  return (
    <span className="inline-flex items-center gap-2 min-w-0">
      <span className="w-6 h-6 rounded-full bg-[#e3d5c8] text-[#5c4a3d] flex items-center justify-center text-[10px] font-semibold shrink-0 overflow-hidden">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-zinc-900 dark:text-zinc-100 truncate">
          {name}
        </span>
        {subtitle ? (
          <span className="block text-[11px] text-zinc-500 truncate">{subtitle}</span>
        ) : null}
      </span>
    </span>
  );
}

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          toast.success(`${label} copied`);
        } catch {
          toast.error("Copy failed");
        }
      }}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800"
      title={label}
    >
      <Copy className="w-3 h-3" />
      {label}
    </button>
  );
}

type PageTab = { page: number; title: string };

function derivePageTabs(
  extracted: Record<string, unknown> | null
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

  const pageCount =
    typeof extracted?.page_count === "number" ? extracted.page_count : 2;
  return Array.from({ length: Math.max(1, pageCount) }, (_, i) => ({
    page: i + 1,
    title: `Page ${i + 1}`,
  }));
}

function asExtractionRecord(
  extracted: StoredDocument["extractedJson"]
): Record<string, unknown> | null {
  if (!extracted || typeof extracted !== "object") return null;
  return extracted as Record<string, unknown>;
}

export function documentHref(doc: {
  documentId?: string;
  id?: string;
  projectId?: string | null;
}) {
  const documentId = doc.documentId || doc.id;
  if (!documentId) return "/drive";
  // Drive / no-project docs — dedicated viewer (avoids /documents redirect conflict)
  if (!doc.projectId) {
    return `/view/${documentId}`;
  }
  return `/projects/${doc.projectId}/documents/${documentId}`;
}

type DocumentDetailViewProps = {
  documentId: string;
  /** When set, document must belong to this project */
  expectedProjectId?: string | null;
  backHref: string;
  backLabel: string;
};

export function DocumentDetailView({
  documentId,
  expectedProjectId,
  backHref,
  backLabel,
}: DocumentDetailViewProps) {
  const router = useRouter();
  const { activeOrgId } = useAuth();
  const [doc, setDoc] = useState<StoredDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const [showReprocessModal, setShowReprocessModal] = useState(false);
  const [reprocessContext, setReprocessContext] = useState("");
  const [pdfPage, setPdfPage] = useState(1);
  const [activeTab, setActiveTab] = useState<DetailTab>("extraction");
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  async function loadDocument(silent = false) {
    if (!activeOrgId) return null;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(
        `/api/documents/${documentId}`,
        withOrgHeaders(activeOrgId)
      );
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as StoredDocument;
      if (
        expectedProjectId &&
        data.projectId &&
        data.projectId !== expectedProjectId
      ) {
        throw new Error("Document not found");
      }
      if (expectedProjectId && !data.projectId) {
        throw new Error("Document not found");
      }
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
    if (!documentId) return;
    void loadDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, expectedProjectId, activeOrgId]);

  useEffect(() => {
    if (!doc || doc.status !== "processing") return;
    const interval = setInterval(() => {
      void loadDocument(true);
    }, 1500);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc?.status, documentId, activeOrgId]);

  const extracted = useMemo(
    () => asExtractionRecord(doc?.extractedJson ?? null),
    [doc?.extractedJson]
  );

  const pageTabs = useMemo(
    () => (doc ? derivePageTabs(extracted) : [{ page: 1, title: "Page 1" }]),
    [doc, extracted]
  );

  useEffect(() => {
    if (!pageTabs.some((tab) => tab.page === pdfPage)) {
      setPdfPage(pageTabs[0]?.page ?? 1);
    }
  }, [pageTabs, pdfPage]);

  const loadTimeline = async () => {
    if (!activeOrgId || !documentId) return;
    setTimelineLoading(true);
    try {
      const res = await fetch(
        `/api/documents/${documentId}/timeline`,
        withOrgHeaders(activeOrgId)
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load timeline");
      setTimeline(Array.isArray(data.events) ? data.events : []);
    } catch {
      setTimeline([]);
    } finally {
      setTimelineLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "activity" && activeOrgId && documentId) {
      void loadTimeline();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, documentId, activeOrgId]);

  const handleReprocess = async () => {
    if (!doc || !activeOrgId) return;
    setReprocessing(true);
    try {
      const res = await fetch(
        `/api/documents/${doc.id}/reprocess`,
        withOrgHeaders(activeOrgId, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userContext: reprocessContext.trim() || undefined,
          }),
        })
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reprocess failed");
      toast.success("Re-extraction queued");
      setShowReprocessModal(false);
      setReprocessContext("");
      setDoc((prev) =>
        prev
          ? {
              ...prev,
              status: "processing",
              extractedJson: null,
            }
          : prev
      );
      await loadDocument(true);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Reprocess failed");
    } finally {
      setReprocessing(false);
    }
  };

  const handleDelete = async () => {
    if (!doc || !activeOrgId) return;
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
        `/api/documents/${doc.id}`,
        withOrgHeaders(activeOrgId, { method: "DELETE" })
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");

      toast.success("File removed — context retained");
      router.push(backHref);
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
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Document not found
        </p>
        <Link href={backHref} className="text-sm text-[#2563eb] hover:underline">
          {backLabel}
        </Link>
      </div>
    );
  }

  const fileUrl = `/api/documents/${doc.id}/file`;
  const hasFields =
    extracted &&
    Object.values(extracted).some(
      (value) => value !== null && value !== undefined && value !== ""
    );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 sm:px-6 py-3 pt-16 sm:pt-20 shrink-0">
        <div className="max-w-6xl mx-auto">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {backLabel}
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold text-gray-900 truncate">
                  {doc.displayTitle?.trim() || doc.originalFilename}
                </h1>
                <StatusBadge status={doc.status} />
              </div>
              {doc.displayTitle?.trim() &&
                doc.displayTitle.trim() !== doc.originalFilename && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {doc.originalFilename}
                  </p>
                )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowReprocessModal(true)}
                disabled={
                  reprocessing ||
                  deleting ||
                  doc.status === "processing" ||
                  Boolean(doc.filePurgedAt)
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {reprocessing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Re-run
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || reprocessing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Delete
              </button>
            </div>
          </div>

          {doc.status === "processing" && (
            <div className="mt-3 flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              Extracting fields…
            </div>
          )}

          <div className="mt-4 flex gap-1 border-b border-gray-100 -mb-px">
            {(
              [
                { id: "extraction" as const, label: "Extraction", icon: FileText },
                { id: "json" as const, label: "JSON", icon: Braces },
                { id: "activity" as const, label: "Activity", icon: Clock },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                    activeTab === tab.id
                      ? "border-gray-900 text-gray-900 dark:border-zinc-100 dark:text-zinc-50"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-zinc-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
        <div className="max-w-6xl mx-auto">
          {activeTab === "extraction" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-gray-50 dark:bg-zinc-950/40">
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs">
                  <span className="text-gray-500">Preview</span>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-900 dark:text-zinc-100 hover:underline"
                  >
                    Open file
                  </a>
                </div>
                {doc.mimeType.includes("pdf") && pageTabs.length > 1 && (
                  <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                    {pageTabs.map((tab) => (
                      <button
                        key={`${tab.page}-${tab.title}`}
                        type="button"
                        onClick={() => setPdfPage(tab.page)}
                        className={`px-2 py-1 rounded text-[11px] font-medium ${
                          pdfPage === tab.page
                            ? "bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                            : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {tab.page}
                      </button>
                    ))}
                  </div>
                )}
                <div className="p-3">
                  {doc.mimeType.includes("pdf") ? (
                    <div
                      className="overflow-hidden rounded-lg border border-gray-200 dark:border-zinc-800 bg-white"
                      style={{ height: "420px" }}
                    >
                      <iframe
                        src={`${fileUrl}#page=${pdfPage}&view=FitH`}
                        className="h-full w-full"
                        title={`PDF page ${pdfPage}`}
                        key={pdfPage}
                      />
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fileUrl}
                      alt="Preview"
                      className="w-full rounded-lg border border-gray-200 dark:border-zinc-800"
                    />
                  )}
                </div>
              </div>

              <div>
                {hasFields ? (
                  <ExtractionFields
                    data={extracted!}
                    fieldConfidence={doc.fieldConfidence}
                    documentId={doc.id}
                    organisationId={activeOrgId}
                    onSaved={(next) => {
                      setDoc((prev) =>
                        prev
                          ? {
                              ...prev,
                              extractedJson: next as StoredDocument["extractedJson"],
                              displayTitle:
                                typeof next.suggested_title === "string"
                                  ? next.suggested_title
                                  : prev.displayTitle,
                            }
                          : prev
                      );
                      toast.success("Corrections saved");
                      void loadTimeline();
                    }}
                  />
                ) : (
                  <div className="border border-gray-200 dark:border-zinc-800 rounded-xl p-8 text-center text-sm text-gray-500">
                    {doc.status === "processing"
                      ? "Extraction in progress…"
                      : doc.status === "failed"
                        ? doc.processingError || "Extraction failed."
                        : "No extracted data yet."}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === "json" ? (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950/60">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    Webhook payload
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Same shape sent on{" "}
                    <code className="text-[11px]">document.processed</code>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          JSON.stringify(buildWebhookPayloadPreview(doc), null, 2)
                        );
                        toast.success("JSON copied");
                      } catch {
                        toast.error("Copy failed");
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob(
                        [
                          JSON.stringify(
                            buildWebhookPayloadPreview(doc),
                            null,
                            2
                          ),
                        ],
                        { type: "application/json" }
                      );
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${doc.id}-document.processed.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download JSON
                  </button>
                </div>
              </div>
              <pre className="p-4 text-[12px] leading-relaxed overflow-x-auto max-h-[70vh] text-zinc-800 dark:text-zinc-200 font-mono bg-zinc-50 dark:bg-zinc-900/50">
                {JSON.stringify(buildWebhookPayloadPreview(doc), null, 2)}
              </pre>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-1 space-y-4">
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-white dark:bg-zinc-950/60">
                  <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-3">
                    File metadata
                  </h3>
                  <dl className="space-y-3 text-xs">
                    <div className="flex justify-between gap-3">
                      <dt className="text-zinc-500 shrink-0">Type</dt>
                      <dd className="text-zinc-900 dark:text-zinc-100 text-right break-all">
                        {doc.mimeType}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-zinc-500 shrink-0">Size</dt>
                      <dd className="text-zinc-900 dark:text-zinc-100 text-right">
                        {formatBytes(doc.size)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-zinc-500 shrink-0">Uploaded</dt>
                      <dd className="text-zinc-900 dark:text-zinc-100 text-right">
                        {new Date(doc.uploadedAt).toLocaleString()}
                      </dd>
                    </div>
                    {doc.processedAt && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-zinc-500 shrink-0">Processed</dt>
                        <dd className="text-zinc-900 dark:text-zinc-100 text-right">
                          {new Date(doc.processedAt).toLocaleString()}
                        </dd>
                      </div>
                    )}
                    {doc.confidence > 0 && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-zinc-500 shrink-0">Confidence</dt>
                        <dd className="text-zinc-900 dark:text-zinc-100 text-right">
                          {(doc.confidence * 100).toFixed(0)}%
                        </dd>
                      </div>
                    )}
                    {doc.extractionStrategy &&
                      doc.extractionStrategy !== "demo" &&
                      doc.extractionStrategy !== "pending" && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-zinc-500 shrink-0">Strategy</dt>
                          <dd className="text-zinc-900 dark:text-zinc-100 text-right font-mono">
                            {doc.extractionStrategy}
                          </dd>
                        </div>
                      )}
                    {doc.projectId && (
                      <div className="flex justify-between gap-3 items-start">
                        <dt className="text-zinc-500 shrink-0 pt-0.5">Project</dt>
                        <dd className="text-right">
                          <Link
                            href={`/projects/${doc.projectId}`}
                            className="text-[#2563eb] hover:underline font-medium"
                          >
                            {doc.projectName?.trim() || "Untitled project"}
                          </Link>
                        </dd>
                      </div>
                    )}
                    {(doc.uploadedByUser || doc.uploadedBy) && (
                      <div className="flex justify-between gap-3 items-center">
                        <dt className="text-zinc-500 shrink-0">Uploaded by</dt>
                        <dd className="text-right">
                          <UserChip
                            name={
                              doc.uploadedByUser?.name?.trim() ||
                              "Unknown user"
                            }
                            avatar={doc.uploadedByUser?.avatar}
                          />
                        </dd>
                      </div>
                    )}
                    {doc.contentHash && (
                      <div className="flex justify-between gap-3 items-start">
                        <dt className="text-zinc-500 shrink-0 pt-0.5">
                          Content hash
                        </dt>
                        <dd className="text-right space-y-1">
                          <p className="font-mono text-zinc-900 dark:text-zinc-100 break-all">
                            {doc.contentHash.slice(0, 20)}…
                          </p>
                          <CopyButton value={doc.contentHash} label="Copy hash" />
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-white dark:bg-zinc-950/60">
                  <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-3">
                    Retention
                  </h3>
                  <dl className="space-y-2.5 text-xs">
                    {[
                      doc.keepForever
                        ? ["Policy", "Keep forever"]
                        : doc.retentionDays
                          ? ["Retention", `${doc.retentionDays} days`]
                          : ["Policy", "Default (15 days)"],
                      doc.fileExpiresAt && !doc.filePurgedAt
                        ? [
                            "File expires",
                            new Date(doc.fileExpiresAt).toLocaleString(),
                          ]
                        : null,
                      doc.filePurgedAt
                        ? [
                            "File purged",
                            new Date(doc.filePurgedAt).toLocaleString(),
                          ]
                        : null,
                      [
                        "Context",
                        doc.filePurgedAt
                          ? "Retained (AI/search)"
                          : "File + context active",
                      ],
                    ]
                      .filter(Boolean)
                      .map((row) => (
                        <div key={row![0]} className="flex justify-between gap-3">
                          <dt className="text-zinc-500">{row![0]}</dt>
                          <dd className="text-zinc-900 dark:text-zinc-100 text-right">
                            {row![1]}
                          </dd>
                        </div>
                      ))}
                  </dl>
                </div>
              </div>

              <div className="lg:col-span-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950/60 overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    Timeline
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Uploads, extractions, webhooks, and retention events
                  </p>
                </div>
                <div className="p-4">
                  {timelineLoading ? (
                    <div className="flex items-center gap-2 py-8 text-sm text-zinc-500 justify-center">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading…
                    </div>
                  ) : timeline.length === 0 ? (
                    <p className="text-sm text-zinc-500 py-8 text-center">
                      No activity recorded yet.
                    </p>
                  ) : (
                    <ul className="space-y-0">
                      {timeline.map((event, index) => {
                        const detail = describeTimelineEvent(event);
                        const style = timelineStyle(event.action);
                        const Icon = style.icon;
                        const actorName =
                          event.actor?.name ||
                          (event.actorId?.startsWith("system:")
                            ? "System"
                            : event.actorId
                              ? event.actorId.slice(0, 8)
                              : "Unknown");
                        return (
                          <li
                            key={`${event.timestamp}-${event.action}-${index}`}
                            className="flex gap-3 pb-5 last:pb-0"
                          >
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ring-4 ring-white dark:ring-zinc-950 ${style.bg} ${style.ring}`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              {index < timeline.length - 1 && (
                                <div className="w-0.5 flex-1 bg-gradient-to-b from-zinc-200 to-zinc-100 dark:from-zinc-700 dark:to-zinc-800 mt-1.5 min-h-[16px]" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                                  {formatTimelineAction(event.action)}
                                </p>
                                <time className="text-[11px] text-zinc-400 tabular-nums">
                                  {new Date(event.timestamp).toLocaleString()}
                                </time>
                              </div>
                              {detail && (
                                <p className="text-xs text-zinc-500 mt-1 break-all">
                                  {detail}
                                </p>
                              )}
                              <div className="mt-2">
                                <UserChip
                                  name={actorName}
                                  avatar={event.actor?.avatar}
                                  subtitle={
                                    event.actor?.isSystem
                                      ? "Automated"
                                      : event.actor?.email || null
                                  }
                                />
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showReprocessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111827] w-full max-w-lg rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
              Re-run extraction?
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              This uses one monthly extraction credit and replaces the current
              extracted fields. You can optionally add context to guide the model.
            </p>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                Additional context (optional)
              </label>
              <textarea
                value={reprocessContext}
                onChange={(e) => setReprocessContext(e.target.value)}
                rows={4}
                placeholder="e.g. Patient name is handwritten near the top right; client code is LUPIN-… "
                className="mt-1.5 w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-900 px-3 py-2.5 text-sm text-gray-900 dark:text-slate-100 outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] resize-y"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={reprocessing}
                onClick={() => {
                  setShowReprocessModal(false);
                  setReprocessContext("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reprocessing}
                onClick={() => void handleReprocess()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg disabled:opacity-50"
              >
                {reprocessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Confirm re-run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
