"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Upload,
  Folder,
  FileText,
  Image as ImageIcon,
  Grid3x3,
  List,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { UploadModal, type UploadProjectOption } from "@/components/UploadModal";
import { useAuth } from "@/components/AuthProvider";
import { documentHref } from "@/components/documents/DocumentDetailView";
import { withOrgHeaders } from "@/lib/client-api";
import type { UploadResult } from "@/lib/upload-document";
import { useRouter } from "next/navigation";

type DriveDocument = {
  documentId: string;
  projectId: string | null;
  originalFilename: string;
  displayTitle?: string | null;
  mimeType: string;
  size: number;
  status: string;
  sharedWithOrganisation?: boolean;
  updatedAt?: string;
};

function docTitle(doc: { displayTitle?: string | null; originalFilename: string }) {
  return doc.displayTitle?.trim() || doc.originalFilename;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatModified(dateStr?: string) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function mimeToType(mime: string): "pdf" | "doc" | "image" | "csv" | "folder" {
  if (mime.includes("pdf")) return "pdf";
  if (mime.includes("image")) return "image";
  if (mime.includes("csv") || mime.includes("spreadsheet")) return "csv";
  if (mime.includes("word") || mime.includes("document")) return "doc";
  return "pdf";
}

function typeIcon(type: string, className = "w-5 h-5") {
  if (type === "folder") return <Folder className={`${className} text-amber-500`} />;
  if (type === "image") return <ImageIcon className={`${className} text-sky-400`} />;
  return <FileText className={`${className} text-rose-400`} />;
}

function DocMeta({ item }: { item: DriveDocument }) {
  return (
    <div className="flex gap-2 mt-0.5 flex-wrap">
      {item.projectId ? (
        <Link
          href={`/projects/${item.projectId}`}
          className="text-[11px] text-[#2563eb] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          In project
        </Link>
      ) : (
        <span className="text-[11px] text-gray-400 dark:text-slate-500">Drive</span>
      )}
      <span
        className={`text-[11px] font-medium ${
          item.sharedWithOrganisation !== false
            ? "text-[#2563eb]"
            : "text-amber-500"
        }`}
      >
        {item.sharedWithOrganisation !== false ? "Shared" : "Private"}
      </span>
      {item.status === "completed" && (
        <span className="text-[11px] text-emerald-500 font-medium">Indexed</span>
      )}
    </div>
  );
}

export default function DrivePage() {
  const { activeOrgId } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<"grid" | "list">("list");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [documents, setDocuments] = useState<DriveDocument[]>([]);
  const [projects, setProjects] = useState<UploadProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadDocuments = useCallback(async () => {
    if (!activeOrgId) {
      setDocuments([]);
      return;
    }

    try {
      const res = await fetch("/api/documents", withOrgHeaders(activeOrgId));
      const data = await res.json();
      if (res.ok) {
        setDocuments(data.documents || []);
      } else {
        setDocuments([]);
      }
    } catch {
      setDocuments([]);
    }
  }, [activeOrgId]);

  const loadProjects = useCallback(async () => {
    if (!activeOrgId) {
      setProjects([]);
      return;
    }
    try {
      const res = await fetch("/api/projects", withOrgHeaders(activeOrgId));
      const data = await res.json();
      if (res.ok) {
        const list = (data.projects || []).map(
          (p: { projectId: string; name: string }) => ({
            projectId: p.projectId,
            name: p.name,
          })
        );
        setProjects(list);
      } else {
        setProjects([]);
      }
    } catch {
      setProjects([]);
    }
  }, [activeOrgId]);

  useEffect(() => {
    async function load() {
      if (!activeOrgId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      await Promise.all([loadDocuments(), loadProjects()]);
      setLoading(false);
    }
    load();
  }, [activeOrgId, loadDocuments, loadProjects]);

  const handleUploadSuccess = (results: UploadResult[]) => {
    const count = results.length;
    toast.success(
      count === 1
        ? `"${results[0].filename}" uploaded`
        : `${count} documents uploaded`
    );
    const last = results[results.length - 1];
    if (last?.documentId) {
      router.push(
        documentHref({
          documentId: last.documentId,
          projectId: last.projectId ?? null,
        })
      );
      return;
    }
    void loadDocuments();
  };

  const filtered = documents.filter(
    (doc) =>
      !search ||
      docTitle(doc).toLowerCase().includes(search.toLowerCase()) ||
      doc.originalFilename.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (item: DriveDocument) => {
    if (!activeOrgId) return;
    if (
      !confirm(
        `Remove "${docTitle(item)}" from Drive?\n\nThe original file will be deleted from storage. Extracted context stays available for AI chat.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(
        `/api/documents/${item.documentId}`,
        withOrgHeaders(activeOrgId, { method: "DELETE" })
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      toast.success("File removed — context retained");
      void loadDocuments();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-8 pt-8 sm:pt-10">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Document Drive"
          description="Central storage for uploads and project documents. Files in a project share AI context automatically."
          actions={
            <>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                <Filter className="w-4 h-4 inline mr-2 -mt-0.5" />
                Filter
              </button>
              <button
                type="button"
                onClick={() => setUploadOpen(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-[#1d4ed8] flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
            </>
          }
        />

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search files and folders…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-[#2563eb] dark:text-slate-100"
            />
          </div>
          <div className="flex rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111827] p-0.5">
            <button
              type="button"
              onClick={() => setView("list")}
              className={`p-2 rounded-md transition-colors ${
                view === "list"
                  ? "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white"
                  : "text-gray-400 hover:text-gray-700 dark:hover:text-slate-200"
              }`}
              aria-label="List view"
              aria-pressed={view === "list"}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("grid")}
              className={`p-2 rounded-md transition-colors ${
                view === "grid"
                  ? "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white"
                  : "text-gray-400 hover:text-gray-700 dark:hover:text-slate-200"
              }`}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-2xl">
            <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500 dark:text-slate-400 bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-2xl">
            No documents found
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((item) => {
              const type = mimeToType(item.mimeType);
              const href = documentHref({
                documentId: item.documentId,
                projectId: item.projectId || null,
              });
              return (
                <div
                  key={item.documentId}
                  className="group relative flex flex-col rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111827] p-4 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50/80 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void handleDelete(item);
                    }}
                    className="absolute top-2 right-2 z-10 p-1.5 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 rounded-md transition-opacity"
                    aria-label="Delete file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link href={href} className="flex flex-col flex-1 min-h-0 outline-none">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 dark:bg-slate-800/80">
                      {typeIcon(type, "w-6 h-6")}
                    </div>
                    <p
                      className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate pr-6 group-hover:text-[#2563eb]"
                      title={item.originalFilename}
                    >
                      {docTitle(item)}
                    </p>
                    <DocMeta item={item} />
                    <div className="mt-auto pt-3 flex items-center justify-between text-[11px] text-gray-400 dark:text-slate-500">
                      <span>{formatModified(item.updatedAt)}</span>
                      <span>{formatSize(item.size)}</span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-100 dark:border-white/10 text-[11px] font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider bg-transparent">
              <div className="col-span-6 sm:col-span-5">Name</div>
              <div className="col-span-3 hidden sm:block">Modified</div>
              <div className="col-span-2 hidden md:block">Size</div>
              <div className="col-span-1" />
            </div>

            {filtered.map((item) => {
              const type = mimeToType(item.mimeType);
              const href = documentHref({
                documentId: item.documentId,
                projectId: item.projectId || null,
              });
              return (
                <div
                  key={item.documentId}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(href)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(href);
                    }
                  }}
                  className="grid grid-cols-12 gap-4 px-4 py-3 items-center border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50/80 dark:hover:bg-white/[0.03] text-sm transition-colors cursor-pointer"
                >
                  <div className="col-span-10 sm:col-span-5 flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-gray-50 dark:bg-slate-800/60 shrink-0">
                      {typeIcon(type)}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="font-medium text-gray-900 dark:text-slate-100 truncate group-hover:text-[#2563eb]"
                        title={item.originalFilename}
                      >
                        {docTitle(item)}
                      </p>
                      <DocMeta item={item} />
                    </div>
                  </div>
                  <div className="col-span-3 hidden sm:block text-gray-500 dark:text-slate-400">
                    {formatModified(item.updatedAt)}
                  </div>
                  <div className="col-span-2 hidden md:block text-gray-500 dark:text-slate-400">
                    {formatSize(item.size)}
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(item);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-md"
                      aria-label="Delete file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        organisationId={activeOrgId}
        projects={projects}
        defaultSharedWithOrganisation={false}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
