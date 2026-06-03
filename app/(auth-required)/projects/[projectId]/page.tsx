"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  MessageSquare,
  FileText,
  Sparkles,
  Settings,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { projects } from "@/lib/mock-data";

export default function ProjectDetailPage() {
  const params = useParams();
  const project = projects.find((p) => p.id === params.projectId) ?? projects[0];

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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg"
                >
                  <Upload className="w-4 h-4 inline mr-2 -mt-0.5" />
                  Add documents
                </button>
                <Link
                  href="/intelligence"
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
                {project.documentCount} documents indexed · Context persists across all team chats in this project
              </p>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-gray-900 mb-3">Project documents</h3>
          <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
            {project.documents.map((doc) => (
              <div key={doc.name} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                <FileText className="w-5 h-5 text-red-500 shrink-0" />
                <span className="text-sm font-medium text-gray-800 flex-1">{doc.name}</span>
                <span className="text-xs text-gray-400 capitalize">{doc.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
