"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  MessageSquare,
  FileText,
  Sparkles,
  Settings,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { UploadModal } from "@/components/UploadModal";
import { projects } from "@/lib/mock-data";
import { supportsProjectUpload } from "@/lib/project-config";
import { StoredDocument } from "@/types/extraction";

type ListedDocument = {
  id?: string;
  name: string;
  status: string;
  href?: string;
  uploading?: boolean;
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = String(params.projectId);
  const project = projects.find((p) => p.id === projectId) ?? projects[0];
  const canUpload = supportsProjectUpload(projectId);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<ListedDocument[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadUploadedDocs = useCallback(async () => {
    if (!canUpload) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/upload`);
      if (!res.ok) return;
      const data = await res.json();
      const docs = (data.documents as StoredDocument[]).map((doc) => ({
        id: doc.id,
        name: doc.originalFilename,
        status: doc.status === "completed" ? "indexed" : doc.status,
        href: `/projects/${projectId}/documents/${doc.id}`,
      }));
      setUploadedDocs(docs);
    } catch {
      // ignore — demo store may be empty
    }
  }, [canUpload, projectId]);

  useEffect(() => {
    loadUploadedDocs();
  }, [loadUploadedDocs]);

  const staticDocs: ListedDocument[] = project.documents.map((doc) => ({
    name: doc.name,
    status: doc.status,
  }));

  const allDocs = [...uploadedDocs, ...staticDocs];

  const handleUpload = async (files: File[]) => {
    if (!canUpload || files.length === 0) return;

    const file = files[0];
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/projects/${projectId}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      toast.success("Upload started — opening extraction…");
      router.push(`/projects/${projectId}/documents/${data.documentId}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string, name: string) => {
    if (!confirm(`Delete "${name}"? This removes the file and extracted data.`)) return;

    setDeletingId(documentId);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/documents/${documentId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");

      setUploadedDocs((prev) => prev.filter((doc) => doc.id !== documentId));
      toast.success("Document deleted");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f8fafc]">
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 pt-16 sm:pt-20">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            All projects
          </Link>
          <PageHeader
            title={project.name}
            description={project.description}
            actions={
              <>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg"
                >
                  <Settings className="w-4 h-4 inline mr-2 -mt-0.5" />
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => canUpload && setUploadOpen(true)}
                  disabled={!canUpload || uploading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 inline mr-2 -mt-0.5 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 inline mr-2 -mt-0.5" />
                  )}
                  Add documents
                </button>
                <Link
                  href={`/intelligence?project=${projectId}`}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-[#1d4ed8] flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat with project
                </Link>
              </>
            }
          />

          <div className="bg-[#2563eb]/5 border border-[#2563eb]/20 rounded-2xl p-4 mb-8 flex gap-3">
            <Sparkles className="w-5 h-5 text-[#2563eb] shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">Shared AI context active</p>
              <p className="text-sm text-gray-600 mt-0.5">{project.contextTokens}</p>
              <p className="text-xs text-gray-500 mt-2">
                {project.documentCount + uploadedDocs.length} documents indexed · Context
                persists across all team chats in this project
              </p>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-gray-900 mb-3">Project documents</h3>
          <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
            {allDocs.map((doc) => {
              if (doc.id && doc.href) {
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 group"
                  >
                    <Link
                      href={doc.href}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <FileText className="w-5 h-5 text-red-500 shrink-0" />
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {doc.name}
                      </span>
                    </Link>
                    <span className="text-xs text-gray-400 capitalize shrink-0">
                      {doc.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id!, doc.name)}
                      disabled={deletingId === doc.id}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                      title="Delete document"
                    >
                      {deletingId === doc.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={doc.name}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                >
                  <FileText className="w-5 h-5 text-red-500 shrink-0" />
                  <span className="text-sm font-medium text-gray-800 flex-1">{doc.name}</span>
                  <span className="text-xs text-gray-400 capitalize">{doc.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {canUpload && (
        <UploadModal
          isOpen={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onUpload={handleUpload}
        />
      )}
    </div>
  );
}
