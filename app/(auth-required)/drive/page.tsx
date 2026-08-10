"use client";

import { useState } from "react";
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
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { UploadModal } from "@/components/UploadModal";
import { driveItems } from "@/lib/mock-data";

function typeIcon(type: string) {
  if (type === "folder") return <Folder className="w-5 h-5 text-amber-600" />;
  if (type === "image") return <ImageIcon className="w-5 h-5 text-blue-500" />;
  return <FileText className="w-5 h-5 text-red-500" />;
}

export default function DrivePage() {
  const [view, setView] = useState<"grid" | "list">("list");
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-8 pt-16 sm:pt-20">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Document Drive"
          description="Central storage for contracts, uploads, and signed PDFs. Files in a project share AI context automatically."
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
          {driveItems.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-12 gap-4 px-4 py-3 items-center border-b border-gray-50 last:border-0 hover:bg-gray-50/80 text-sm"
            >
              <div className="col-span-10 sm:col-span-5 flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-gray-50 shrink-0">{typeIcon(item.type)}</div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.name}</p>
                  <div className="flex gap-2 mt-0.5">
                    {item.projectId && (
                      <Link
                        href={`/projects/${item.projectId}`}
                        className="text-[11px] text-[#2563eb] hover:underline"
                      >
                        In project
                      </Link>
                    )}
                    {item.signed && (
                      <span className="text-[11px] text-emerald-600 font-medium">Signed</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-span-3 hidden sm:block text-gray-500">{item.modified}</div>
              <div className="col-span-2 hidden md:block text-gray-500">{item.size || "—"}</div>
              <div className="col-span-2 sm:col-span-1 flex justify-end">
                <button type="button" className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={(_files, _consent) => setUploadOpen(false)}
      />
    </div>
  );
}
