"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/components/AuthProvider";

type DomainRow = {
  hostname: string;
  verified: boolean;
  verifiedAt?: string | null;
  txtRecordHost: string;
  txtRecordValue: string;
};

export default function CollectDomainsPage() {
  const { activeOrgId } = useAuth();
  const [items, setItems] = useState<DomainRow[]>([]);
  const [hostname, setHostname] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!activeOrgId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/organisations/${activeOrgId}/collect-domains`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setItems(Array.isArray(data.data) ? data.data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    load();
  }, [load]);

  const addDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrgId || !hostname.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/organisations/${activeOrgId}/collect-domains`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostname: hostname.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add");
      setHostname("");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const verify = async (host: string) => {
    if (!activeOrgId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/organisations/${activeOrgId}/collect-domains/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hostname: host }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-8 pt-16 sm:pt-20">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/request-links"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
        <PageHeader
          title="Collect custom domains"
          description="Point a hostname at the DoqSeal dashboard App Service, then verify ownership with a TXT record."
        />

        <form
          onSubmit={addDomain}
          className="flex flex-col sm:flex-row gap-2 mb-6"
        >
          <input
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
            placeholder="docs.yourcompany.com"
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg disabled:opacity-60"
          >
            <Plus className="w-4 h-4" /> Add domain
          </button>
        </form>

        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">No custom domains yet.</p>
        ) : (
          <div className="space-y-4">
            {items.map((d) => (
              <div
                key={d.hostname}
                className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{d.hostname}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {d.verified
                        ? `Verified${d.verifiedAt ? ` · ${new Date(d.verifiedAt).toLocaleString()}` : ""}`
                        : "Pending TXT verification"}
                    </p>
                  </div>
                  {d.verified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => verify(d.hostname)}
                      className="text-xs font-medium px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
                    >
                      Check DNS
                    </button>
                  )}
                </div>
                {!d.verified && (
                  <div className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-1">
                    <p>
                      Add TXT at{" "}
                      <code className="font-mono">{d.txtRecordHost}</code>
                    </p>
                    <p className="break-all">
                      Value:{" "}
                      <code className="font-mono">{d.txtRecordValue}</code>
                    </p>
                    <p className="text-slate-500 pt-1">
                      Also CNAME the hostname to your Azure App Service (
                      doqseal-prod-dashboard) after DoqSeal attaches the custom
                      hostname.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
