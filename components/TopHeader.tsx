"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { PenLine, Brain } from "lucide-react";

export function TopHeader() {
  const { userData, activeOrg } = useAuth();

  return (
    <div className="absolute top-4 right-4 sm:right-6 left-4 sm:left-auto flex items-center justify-between sm:justify-end gap-3 z-10 pointer-events-none">
      <div className="sm:hidden flex items-center text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-sm pointer-events-auto truncate max-w-[140px]">
        <span className="truncate">{activeOrg?.name || userData?.organisationName || "Workspace"}</span>
      </div>
      <div className="flex items-center gap-2 pointer-events-auto ml-auto">
        <Link
          href="/sign/new"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        >
          <PenLine className="w-3.5 h-3.5" />
          New envelope
        </Link>
        <Link
          href="/intelligence"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#2563eb] rounded-lg hover:bg-[#1d4ed8] transition-colors shadow-sm"
        >
          <Brain className="w-3.5 h-3.5" />
          Ask AI
        </Link>
        <div className="flex items-center text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
          <span className="text-gray-600 max-w-[120px] truncate hidden sm:inline">
            {activeOrg?.name || userData?.organisationName || "Organisation"}
          </span>
          <span className="mx-2 text-gray-300 hidden sm:inline">•</span>
          <span className="text-[#2563eb] uppercase tracking-tight font-bold text-[10px]">
            {activeOrg?.role || "Member"}
          </span>
        </div>
      </div>
    </div>
  );
}
