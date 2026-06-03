"use client";

import { useState } from "react";
import { Plus, Search, Copy, Check, FileText, MoreVertical, ExternalLink, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

const mockRequests = [
  {
    id: "req-1",
    recipientName: "Vendor onboarding — Acme",
    recipientEmail: "legal@acme.com",
    documentsRequested: ["Signed MSA", "Insurance certificate", "SOC 2 report"],
    link: "https://doqseal.com/r/q8xZp2n9",
    createdAt: "Jun 1, 2026",
    expiresAt: "Jun 15, 2026",
    status: "Active",
  },
  {
    id: "req-2",
    recipientName: "Freelancer KYC pack",
    recipientEmail: "alex@freelance.io",
    documentsRequested: ["NDA", "Government ID", "Tax form"],
    link: "https://doqseal.com/r/m4vKj7h1",
    createdAt: "May 28, 2026",
    expiresAt: "Jun 10, 2026",
    status: "Active",
  },
];

export default function CollectDocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const handleCopyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const filtered = mockRequests.filter(
    (req) =>
      req.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-8 pt-16 sm:pt-20">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Collect documents"
          description="Send secure upload links to clients, vendors, or freelancers. Incoming files land in your Document Drive and can attach to projects."
          actions={
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-[#1d4ed8] flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New collection link
            </button>
          }
        />

        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#2563eb]"
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {filtered.length > 0 ? (
            filtered.map((req) => (
              <div
                key={req.id}
                className="p-5 border-b border-gray-100 last:border-0 hover:bg-gray-50/80 grid lg:grid-cols-12 gap-4 items-center"
              >
                <div className="lg:col-span-3">
                  <p className="font-medium text-gray-900">{req.recipientName}</p>
                  <p className="text-xs text-gray-500">{req.recipientEmail}</p>
                </div>
                <div className="lg:col-span-4 flex flex-wrap gap-1.5">
                  {req.documentsRequested.map((doc) => (
                    <span
                      key={doc}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-gray-50 border border-gray-200 rounded-full"
                    >
                      <FileText className="w-3 h-3" />
                      {doc}
                    </span>
                  ))}
                </div>
                <div className="lg:col-span-3 flex items-center gap-2 font-mono text-xs text-gray-600">
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  <span className="truncate">{req.link.replace("https://", "")}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(req.link, req.id)}
                    className="p-1.5 hover:bg-gray-100 rounded-md"
                  >
                    {copiedLinkId === req.id ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="lg:col-span-2 flex justify-between lg:justify-end items-center">
                  <span className="text-xs text-gray-500">Expires {req.expiresAt}</span>
                  <button type="button" className="p-1.5 text-gray-400">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center">
              <ShieldAlert className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No collection links yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
