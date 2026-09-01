"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FolderKanban, FileText, Sparkles, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/components/AuthProvider";
import { withOrgHeaders } from "@/lib/client-api";

type Project = {
  projectId: string;
  name: string;
  description?: string;
  extractionHint?: string;
  status: string;
  sharedWithOrganisation?: boolean;
  updatedAt?: string;
};

export default function ProjectsPage() {
  const { activeOrgId } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [shareWithOrg, setShareWithOrg] = useState(true);

  const loadProjects = useCallback(async () => {
    if (!activeOrgId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/projects", withOrgHeaders(activeOrgId));
      const data = await res.json();
      if (res.ok) {
        setProjects(data.projects || []);
      }
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const resetModal = () => {
    setShowCreateModal(false);
    setNewName("");
    setNewDescription("");
    setShareWithOrg(true);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrgId || newName.trim().length < 2) return;

    setCreating(true);
    try {
      const res = await fetch(
        "/api/projects",
        withOrgHeaders(activeOrgId, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newName.trim(),
            description: newDescription.trim() || undefined,
            sharedWithOrganisation: shareWithOrg,
          }),
        })
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create project");

      toast.success(
        shareWithOrg
          ? "Project created and shared with your organisation"
          : "Private project created — only you can see it"
      );
      const createdId = data.project?.projectId as string | undefined;
      resetModal();
      if (createdId) {
        // Send users straight to settings to configure extraction context
        window.location.href = `/projects/${createdId}/settings`;
        return;
      }
      await loadProjects();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-8 pt-16 sm:pt-20">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Projects"
          description="Diagnostic center workspaces with user-defined extraction schemas."
          actions={
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-[#1d4ed8] flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New project
            </button>
          }
        />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
            <p className="text-sm text-gray-600">No projects yet for this organisation.</p>
            <p className="text-xs text-gray-400 mt-2">
              Create your first project to start uploading and extracting documents.
            </p>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-[#1d4ed8] inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New project
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.projectId}
                href={`/projects/${project.projectId}`}
                className="group bg-white border border-gray-200 rounded-2xl p-5 hover:border-[#2563eb]/40 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-[#2563eb]/10 text-[#2563eb]">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {project.status}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        project.sharedWithOrganisation !== false
                          ? "text-[#2563eb] bg-[#2563eb]/10"
                          : "text-amber-700 bg-amber-50"
                      }`}
                    >
                      {project.sharedWithOrganisation !== false ? "Shared" : "Private"}
                    </span>
                  </div>
                </div>
                <h2 className="font-semibold text-gray-900 group-hover:text-[#2563eb] transition-colors">
                  {project.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {project.description || "No description"}
                </p>
                {project.extractionHint && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-[#2563eb] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-3">
                      {project.extractionHint}
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    Upload enabled
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={resetModal} />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-[#333]">New project</h3>
                <button
                  type="button"
                  onClick={resetModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="project-name"
                    className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1"
                  >
                    Name
                  </label>
                  <input
                    id="project-name"
                    required
                    minLength={2}
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Insurance Documents"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-[#2563eb] outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="project-description"
                    className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="project-description"
                    rows={3}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="What kind of documents will this project handle?"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-[#2563eb] outline-none transition-all resize-none"
                  />
                </div>

                <label className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareWithOrg}
                    onChange={(e) => setShareWithOrg(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[#2563eb]"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-[#333]">
                      Share with organisation
                    </span>
                    <span className="text-xs text-gray-500 leading-relaxed">
                      {shareWithOrg
                        ? "All org members can open this project and use its documents in AI context."
                        : "Only you can see this project and its documents."}
                    </span>
                  </span>
                </label>

                <p className="text-xs text-gray-400 px-1">
                  After create you&apos;ll set extraction context on the settings page.
                </p>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetModal}
                    className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={creating || newName.trim().length < 2}
                    type="submit"
                    className="flex-1 py-3 bg-[#2563eb] text-white rounded-xl font-medium text-sm hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
