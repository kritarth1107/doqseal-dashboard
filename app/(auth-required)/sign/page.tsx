"use client";

import Link from "next/link";
import { Plus, Search, FileSignature, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { signEnvelopes } from "@/lib/mock-data";

const statusStyle: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-50 text-blue-700",
  in_progress: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
  voided: "bg-red-50 text-red-600",
};

export default function SignEnvelopesPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-8 pt-16 sm:pt-20">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="E-Sign envelopes"
          description="DocuSign-style workflows: upload a PDF, place signature fields for you and counterparties, send for signing, and track status."
          actions={
            <Link
              href="/sign/new"
              className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-[#1d4ed8] flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create envelope
            </Link>
          }
        />

        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search envelopes…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#2563eb]"
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {signEnvelopes.map((env) => (
            <Link
              key={env.id}
              href={`/sign/${env.id}`}
              className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 border-b border-gray-100 last:border-0 hover:bg-gray-50/80 transition-colors"
            >
              <div className="p-3 rounded-xl bg-[#2563eb]/10 text-[#2563eb] shrink-0 w-fit">
                <FileSignature className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{env.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {env.signers.filter((s) => s.role === "signer").length} signers · Updated {env.updatedAt}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {env.signers.map((s) => (
                    <span
                      key={s.email}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                    >
                      {s.name}
                      {s.status === "signed" ? " ✓" : ""}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {env.expiresAt && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {env.expiresAt}
                  </span>
                )}
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusStyle[env.status]}`}
                >
                  {env.status.replace("_", " ")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
