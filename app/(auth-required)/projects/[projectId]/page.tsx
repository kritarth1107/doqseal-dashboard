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
  Webhook,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { UploadModal } from "@/components/UploadModal";
import { useAuth } from "@/components/AuthProvider";
import { withOrgHeaders } from "@/lib/client-api";
import { StoredDocument } from "@/types/extraction";
import { ProjectWebhook } from "@/lib/webhook-events";

type Project = {
  projectId: string;
  name: string;
  description?: string;
  extractionHint?: string;
  webhooks?: ProjectWebhook[];
  webhookUrls?: string[];
};

type ListedDocument = {
  id: string;
  name: string;
  originalFilename?: string;
  status: string;
  href: string;
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { activeOrgId } = useAuth();
  const projectId = String(params.projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<ListedDocument[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProject = useCallback(async () => {
    if (!activeOrgId) return;
    try {
      const res = await fetch(
        `/api/projects/${projectId}`,
        withOrgHeaders(activeOrgId)
      );
      if (!res.ok) throw new Error("Project not found");
      const data = await res.json();
      setProject(data.project);
    } catch {
      setProject(null);
    }
  }, [activeOrgId, projectId]);

  const loadUploadedDocs = useCallback(async () => {
    if (!activeOrgId) return;
    try {
      const res = await fetch(
        `/api/projects/${projectId}/upload`,
        withOrgHeaders(activeOrgId)
      );
      if (!res.ok) return;
      const data = await res.json();
      const docs = (data.documents as StoredDocument[]).map((doc) => ({
        id: doc.id,
        name: doc.displayTitle?.trim() || doc.originalFilename,
        originalFilename: doc.originalFilename,
        status: doc.status === "completed" ? "indexed" : doc.status,
        href: `/projects/${projectId}/documents/${doc.id}`,
      }));
      setUploadedDocs(docs);
    } catch {
      setUploadedDocs([]);
    }
  }, [activeOrgId, projectId]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      await Promise.all([loadProject(), loadUploadedDocs()]);
      setLoading(false);
    }
    load();
  }, [loadProject, loadUploadedDocs]);

  const handleUploadSuccess = (
    results: { documentId: string; filename: string }[]
  ) => {
    toast.success("Upload queued — opening extraction…");
    const last = results[results.length - 1];
    if (last) {
      router.push(`/projects/${projectId}/documents/${last.documentId}`);
    } else {
      void loadUploadedDocs();
    }
  };

  const handleDelete = async (documentId: string, name: string) => {
    if (!activeOrgId) return;
    if (
      !confirm(
        `Remove "${name}" from this project?\n\nThe original file will be deleted from storage. Extracted context stays available for AI chat.`
      )
    )
      return;

    setDeletingId(documentId);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/documents/${documentId}`,
        withOrgHeaders(activeOrgId, { method: "DELETE" })
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");

      setUploadedDocs((prev) => prev.filter((doc) => doc.id !== documentId));
      toast.success("File removed — context retained");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f8fafc] gap-3">
        <p className="text-sm text-gray-600">Project not found</p>
        <Link href="/projects" className="text-sm text-[#2563eb] hover:underline">
          Back to projects
        </Link>
      </div>
    );
  }

  const webhookUrl =
    project.webhooks?.[0]?.url || project.webhookUrls?.[0] || "";
  const webhookEvents = project.webhooks?.[0]?.events || [];

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
            description={project.description || ""}
            actions={
              <>
                <Link
                  href={`/projects/${projectId}/settings`}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <Settings className="w-4 h-4 inline mr-2 -mt-0.5" />
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={() => setUploadOpen(true)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg"
                >
                  <Upload className="w-4 h-4 inline mr-2 -mt-0.5" />
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

          <div className="grid gap-4 sm:grid-cols-2 mb-8">
            <Link
              href={`/projects/${projectId}/settings`}
              className="bg-[#2563eb]/5 border border-[#2563eb]/20 rounded-2xl p-4 flex gap-3 hover:border-[#2563eb]/40 transition-colors"
            >
              <Sparkles className="w-5 h-5 text-[#2563eb] shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  Extraction context
                </p>
                <p className="text-sm text-gray-600 mt-0.5 whitespace-pre-wrap line-clamp-4">
                  {project.extractionHint?.trim() ||
                    "No extraction instructions yet — open Settings to tell AI what to extract."}
                </p>
              </div>
            </Link>
            <Link
              href={`/projects/${projectId}/settings`}
              className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-3 hover:border-[#2563eb]/40 transition-colors"
            >
              <Webhook className="w-5 h-5 text-[#2563eb] shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">Webhook</p>
                <p className="text-sm text-gray-600 mt-0.5 truncate">
                  {webhookUrl ||
                    "No webhook configured — set a URL and events in Settings."}
                </p>
                {webhookUrl && webhookEvents.length > 0 && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    Events: {webhookEvents.join(", ")}
                  </p>
                )}
              </div>
            </Link>
          </div>

          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">
            Project documents
          </h3>
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
            {uploadedDocs.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-slate-400">
                No documents uploaded yet.
              </div>
            ) : (
              <>
                <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-3 border-b border-gray-100 dark:border-white/10 text-[11px] font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider bg-transparent">
                  <div className="col-span-8">Name</div>
                  <div className="col-span-3">Status</div>
                  <div className="col-span-1" />
                </div>
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                  {uploadedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex sm:grid sm:grid-cols-12 gap-3 items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.03] group transition-colors"
                    >
                      <Link
                        href={doc.href}
                        className="flex items-center gap-3 flex-1 min-w-0 sm:col-span-8"
                      >
                        <div className="p-2 rounded-lg bg-gray-50 dark:bg-slate-800/60 shrink-0">
                          <FileText className="w-4 h-4 text-rose-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">
                          {doc.name}
                        </span>
                      </Link>
                      <span className="text-xs text-gray-400 dark:text-slate-500 capitalize shrink-0 sm:col-span-3">
                        {doc.status}
                      </span>
                      <div className="sm:col-span-1 flex justify-end shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDelete(doc.id, doc.name)}
                          disabled={deletingId === doc.id}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete document"
                        >
                          {deletingId === doc.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        organisationId={activeOrgId}
        projectId={projectId}
        defaultSharedWithOrganisation={true}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
