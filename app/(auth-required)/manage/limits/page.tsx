"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Gauge, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { withOrgHeaders } from "@/lib/client-api";

type QuotaItem = {
  id?: string;
  name: string;
  used: number;
  limit: number;
  unit?: string;
  usedLabel?: string;
  limitLabel?: string;
  utilisedText?: string;
  usedRaw?: number;
  limitRaw?: number;
};

type PlanInfo = {
  id: string;
  name: string;
  upgradeAvailable?: boolean;
};

const STARTER_QUOTAS: QuotaItem[] = [
  {
    id: "storage",
    name: "Document storage",
    used: 0,
    limit: 100,
    unit: "MB",
    usedLabel: "0 B",
    limitLabel: "100 MB",
    utilisedText: "0 B utilised of 100 MB",
  },
  {
    id: "extractions",
    name: "AI extractions / month",
    used: 0,
    limit: 500,
    utilisedText: "0 utilised of 500",
  },
  {
    id: "api",
    name: "API requests / day",
    used: 0,
    limit: 10_000,
    utilisedText: "0 utilised of 10,000",
  },
];

function normalizeQuotas(raw: unknown): QuotaItem[] {
  if (Array.isArray(raw)) {
    const items = raw.filter(
      (item): item is QuotaItem =>
        typeof item === "object" &&
        item !== null &&
        "name" in item &&
        "used" in item &&
        "limit" in item
    );
    return items.filter((q) => !/e-?sign|envelope/i.test(q.name));
  }

  if (raw && typeof raw === "object") {
    const usage = raw as Record<string, unknown>;
    if (Array.isArray(usage.quotas)) {
      return normalizeQuotas(usage.quotas);
    }
  }

  return STARTER_QUOTAS;
}

function formatUtilised(q: QuotaItem) {
  if (q.utilisedText) return q.utilisedText;
  if (q.usedLabel && q.limitLabel) {
    return `${q.usedLabel} utilised of ${q.limitLabel}`;
  }
  const used =
    q.unit === "MB" && q.used % 1 !== 0
      ? q.used.toFixed(2)
      : q.used.toLocaleString();
  const limit = q.limit.toLocaleString();
  const unit = q.unit ? ` ${q.unit}` : "";
  return `${used}${unit} utilised of ${limit}${unit}`;
}

export default function LimitsPage() {
  const { activeOrgId } = useAuth();
  const [quotas, setQuotas] = useState<QuotaItem[]>(STARTER_QUOTAS);
  const [plan, setPlan] = useState<PlanInfo>({ id: "starter", name: "Starter" });
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
        if (res.ok && data.usage) {
          setQuotas(normalizeQuotas(data.usage));
          if (data.usage.plan && typeof data.usage.plan === "object") {
            setPlan({
              id: data.usage.plan.id || "starter",
              name: data.usage.plan.name || "Starter",
              upgradeAvailable: Boolean(data.usage.plan.upgradeAvailable),
            });
          }
        } else {
          setQuotas(STARTER_QUOTAS);
        }
      } catch {
        setQuotas(STARTER_QUOTAS);
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
          description="Usage against your current organisation plan."
        />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Current plan
                  </p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{plan.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Included with your organisation. Higher limits will be available when upgrades launch.
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-[#2563eb]">
                  Active
                </span>
              </div>
            </div>

            {quotas.map((q) => {
              const pct = q.limit > 0 ? Math.round((q.used / q.limit) * 100) : 0;
              return (
                <div
                  key={q.id || q.name}
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
                >
                  <div className="flex justify-between items-center mb-2 gap-3">
                    <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-[#2563eb]" />
                      {q.name}
                    </span>
                    <span className="text-sm text-gray-500 text-right">
                      {formatUtilised(q)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct > 85 ? "bg-amber-500" : "bg-[#2563eb]"}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {pct}% utilised
                    {typeof q.usedRaw === "number" && q.id === "storage"
                      ? ` · ${q.usedRaw.toLocaleString()} bytes on disk`
                      : ""}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
