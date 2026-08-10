"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Gauge, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { withOrgHeaders } from "@/lib/client-api";

type QuotaItem = {
  name: string;
  used: number;
  limit: number;
  unit?: string;
};

const FALLBACK_QUOTAS: QuotaItem[] = [
  { name: "Document storage", used: 0, limit: 100, unit: "GB" },
  { name: "AI extractions / month", used: 0, limit: 25000, unit: "" },
  { name: "E-sign envelopes / month", used: 0, limit: 500, unit: "" },
  { name: "API requests / day", used: 0, limit: 50000, unit: "" },
];

function normalizeQuotas(raw: unknown): QuotaItem[] {
  if (Array.isArray(raw)) {
    return raw.filter(
      (item): item is QuotaItem =>
        typeof item === "object" &&
        item !== null &&
        "name" in item &&
        "used" in item &&
        "limit" in item
    );
  }

  if (raw && typeof raw === "object") {
    const usage = raw as Record<string, unknown>;
    if (Array.isArray(usage.quotas)) {
      return normalizeQuotas(usage.quotas);
    }

    const items: QuotaItem[] = [];
    if (typeof usage.uploadCount === "number" && typeof usage.limit === "number") {
      items.push({
        name: "Daily uploads",
        used: usage.uploadCount,
        limit: usage.limit,
      });
    }
    if (items.length > 0) return items;
  }

  return FALLBACK_QUOTAS;
}

export default function LimitsPage() {
  const { activeOrgId } = useAuth();
  const [quotas, setQuotas] = useState<QuotaItem[]>(FALLBACK_QUOTAS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsage() {
      if (!activeOrgId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(
          `/api/organisations/${activeOrgId}/usage`,
          withOrgHeaders(activeOrgId)
        );
        const data = await res.json();
        if (res.ok) {
          setQuotas(normalizeQuotas(data.usage));
        } else {
          setQuotas(FALLBACK_QUOTAS);
        }
      } catch {
        setQuotas(FALLBACK_QUOTAS);
      } finally {
        setLoading(false);
      }
    }

    loadUsage();
  }, [activeOrgId]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-8 pt-16 sm:pt-20">
      <div className="max-w-3xl mx-auto">
        <PageHeader
          title="Limits & quotas"
          description="Monitor usage across your organisation plan. Upgrade for higher API and AI limits."
        />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
          </div>
        ) : (
          <div className="space-y-4">
            {quotas.map((q) => {
              const pct = q.limit > 0 ? Math.round((q.used / q.limit) * 100) : 0;
              return (
                <div key={q.name} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-[#2563eb]" />
                      {q.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {q.used.toLocaleString()}
                      {q.unit && ` ${q.unit}`} / {q.limit.toLocaleString()}
                      {q.unit && ` ${q.unit}`}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct > 85 ? "bg-amber-500" : "bg-[#2563eb]"}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{pct}% used</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
