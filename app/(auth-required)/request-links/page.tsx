"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Copy,
  Check,
  ExternalLink,
  Link2,
  Pause,
  Play,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/components/AuthProvider";
import { withOrgHeaders } from "@/lib/client-api";
import { buildCollectShareUrl } from "@/lib/collect-url";

type RequestLink = {
  requestLinkId: string;
  title: string;
  description?: string | null;
  slug: string;
  shareUrl: string;
  status: string;
  requirements: { label: string }[];
  createdAt?: string;
  expiresAt?: string | null;
};

export default function RequestLinksPage() {
  const { activeOrgId } = useAuth();
  const [items, setItems] = useState<RequestLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeOrgId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "/api/request-links",
        withOrgHeaders(activeOrgId)
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setItems(Array.isArray(data.data) ? data.data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCopy = async (link: RequestLink) => {
    const url = link.shareUrl || buildCollectShareUrl(link.slug);
    await navigator.clipboard.writeText(url);
    setCopiedId(link.requestLinkId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePause = async (link: RequestLink) => {
    if (!activeOrgId) return;
    const next = link.status === "active" ? "paused" : "active";
    await fetch(
      `/api/request-links/${link.requestLinkId}`,
      withOrgHeaders(activeOrgId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
    );
    await load();
  };

  const filtered = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-8 pt-16 sm:pt-20">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Request Links"
          description="Create branded upload links. Customers submit documents on collect.doqseal.com without WhatsApp file sharing."
          actions={
            <div className="flex gap-2">
              <Link
                href="/request-links/domains"
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Custom domains
              </Link>
              <Link
                href="/request-links/new"
                className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-[#1d4ed8] flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New request link
              </Link>
            </div>
          }
        />

        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search links…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#2563eb]"
          />
        </div>

        {loading ? (
          <div className="text-sm text-slate-500">Loading…</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
            <Link2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-800">No request links yet</p>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Create a link, share it, and collect documents securely.
            </p>
            <Link
              href="/request-links/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg"
            >
              <Plus className="w-4 h-4" /> Create link
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {filtered.map((link) => (
              <div
                key={link.requestLinkId}
                className="p-5 border-b border-gray-100 last:border-0 hover:bg-gray-50/80 grid lg:grid-cols-12 gap-4 items-center"
              >
                <div className="lg:col-span-5">
                  <Link
                    href={`/request-links/${link.requestLinkId}`}
                    className="font-semibold text-slate-900 hover:text-[#2563eb]"
                  >
                    {link.title}
                  </Link>
                  <p className="text-xs text-slate-500 mt-1">
                    {link.requirements.map((r) => r.label).join(" · ") ||
                      "No requirements"}
                  </p>
                </div>
                <div className="lg:col-span-3">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      link.status === "active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {link.status}
                  </span>
                </div>
                <div className="lg:col-span-4 flex flex-wrap gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => handleCopy(link)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
                  >
                    {copiedId === link.requestLinkId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Copy link
                  </button>
                  <a
                    href={link.shareUrl || buildCollectShareUrl(link.slug)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open
                  </a>
                  <button
                    type="button"
                    onClick={() => togglePause(link)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
                  >
                    {link.status === "active" ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    {link.status === "active" ? "Pause" : "Activate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
