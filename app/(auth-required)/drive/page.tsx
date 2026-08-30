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
  MoreVertical,
  Grid3x3,
  List,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { UploadModal, type UploadProjectOption } from "@/components/UploadModal";
import { useAuth } from "@/components/AuthProvider";
import { withOrgHeaders } from "@/lib/client-api";
import type { UploadResult } from "@/lib/upload-document";

type DriveDocument = {
  documentId: string;
  projectId: string | null;
  originalFilename: string;
  mimeType: string;
  size: number;
  status: string;
  sharedWithOrganisation?: boolean;
  updatedAt?: string;
};

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

function typeIcon(type: string) {
  if (type === "folder") return <Folder className="w-5 h-5 text-amber-600" />;
  if (type === "image") return <ImageIcon className="w-5 h-5 text-blue-500" />;
  return <FileText className="w-5 h-5 text-red-500" />;
}

export default function DrivePage() {
  const { activeOrgId } = useAuth();
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
    void loadDocuments();
  };

  const filtered = documents.filter(
    (doc) =>
      !search ||
      doc.originalFilename.toLowerCase().includes(search.toLowerCase())
  );

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
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
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
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#2563eb]"
            />
          </div>
          <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setView("list")}
              className={`p-2 rounded-md ${view === "list" ? "bg-gray-100" : ""}`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("grid")}
              className={`p-2 rounded-md ${view === "grid" ? "bg-gray-100" : ""}`}
              aria-label="Grid view"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80">
            <div className="col-span-6 sm:col-span-5">Name</div>
            <div className="col-span-3 hidden sm:block">Modified</div>
            <div className="col-span-2 hidden md:block">Size</div>
            <div className="col-span-1" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-500">
              No documents found
            </div>
          ) : (
            filtered.map((item) => {
              const type = mimeToType(item.mimeType);
              return (
                <div
                  key={item.documentId}
                  className="grid grid-cols-12 gap-4 px-4 py-3 items-center border-b border-gray-50 last:border-0 hover:bg-gray-50/80 text-sm"
                >
                  <div className="col-span-10 sm:col-span-5 flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-gray-50 shrink-0">
                      {typeIcon(type)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {item.originalFilename}
                      </p>
                      <div className="flex gap-2 mt-0.5 flex-wrap">
                        {item.projectId ? (
                          <Link
                            href={`/projects/${item.projectId}`}
                            className="text-[11px] text-[#2563eb] hover:underline"
                          >
                            In project
                          </Link>
                        ) : (
                          <span className="text-[11px] text-gray-400">Drive</span>
                        )}
                        <span
                          className={`text-[11px] font-medium ${
                            item.sharedWithOrganisation !== false
                              ? "text-[#2563eb]"
                              : "text-amber-600"
                          }`}
                        >
                          {item.sharedWithOrganisation !== false
                            ? "Shared"
                            : "Private"}
                        </span>
                        {item.status === "completed" && (
                          <span className="text-[11px] text-emerald-600 font-medium">
                            Indexed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-3 hidden sm:block text-gray-500">
                    {formatModified(item.updatedAt)}
                  </div>
                  <div className="col-span-2 hidden md:block text-gray-500">
                    {formatSize(item.size)}
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
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
