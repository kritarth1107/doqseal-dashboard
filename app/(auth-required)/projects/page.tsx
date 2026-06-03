"use client";

import Link from "next/link";
import { Plus, FolderKanban, Users, FileText, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { projects } from "@/lib/mock-data";

export default function ProjectsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-8 pt-16 sm:pt-20">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Projects"
          description="Diagnostic center workspaces. TRF project AI reads stamps, patient details, and clinical history from uploaded forms."
          actions={
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-[#1d4ed8] flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New project
            </button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group bg-white border border-gray-200 rounded-2xl p-5 hover:border-[#2563eb]/40 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-[#2563eb]/10 text-[#2563eb]">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {project.status}
                </span>
              </div>
              <h2 className="font-semibold text-gray-900 group-hover:text-[#2563eb] transition-colors">
                {project.name}
              </h2>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>
              <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  {project.documentCount} docs
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {project.memberCount}
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-[#2563eb] shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-600 leading-relaxed">{project.contextTokens}</p>
              </div>
              <p className="text-[11px] text-gray-400 mt-3">Updated {project.updatedAt}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
