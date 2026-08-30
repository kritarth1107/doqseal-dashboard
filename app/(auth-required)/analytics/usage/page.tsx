"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { BarChart3, Cpu, FileText, HardDrive, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { withOrgHeaders } from "@/lib/client-api";

type OrgStats = {
  documentCount?: number;
  extractionCount?: number;
  pendingJobs?: number;
};

type QuotaItem = {
  id?: string;
  name: string;
  used: number;
  limit: number;
  unit?: string;
  usedLabel?: string;
  limitLabel?: string;
  utilisedText?: string;
};

type UsageData = {
  uploadCount?: number;
  limit?: number;
  quotas?: QuotaItem[];
  plan?: { name?: string };
};

function formatCount(value?: number) {
  if (value === undefined || value === null) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function findQuota(quotas: QuotaItem[] | undefined, idOrName: RegExp) {
  return quotas?.find(
    (q) => (q.id && idOrName.test(q.id)) || idOrName.test(q.name)
  );
}

export default function AnalyticsUsagePage() {
  const { activeOrgId } = useAuth();
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!activeOrgId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [statsRes, usageRes] = await Promise.all([
          fetch(`/api/organisations/${activeOrgId}/stats`, withOrgHeaders(activeOrgId)),
          fetch(`/api/organisations/${activeOrgId}/usage`, withOrgHeaders(activeOrgId)),
        ]);

        const statsData = await statsRes.json();
        const usageData = await usageRes.json();

        if (statsRes.ok) setStats(statsData.stats || null);
        if (usageRes.ok) setUsage(usageData.usage || null);
      } catch {
        setStats(null);
        setUsage(null);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [activeOrgId]);

  const storage = findQuota(usage?.quotas, /storage/i);
  const extractions = findQuota(usage?.quotas, /extraction/i);
  const api = findQuota(usage?.quotas, /api/i);

  const metrics = [
    {
      label: "Document storage",
      value: storage?.usedLabel || (storage ? `${storage.used}${storage.unit ? ` ${storage.unit}` : ""}` : "—"),
      icon: HardDrive,
      change: storage?.utilisedText
        || (storage ? `${storage.limit} ${storage.unit || "MB"} limit` : "Starter plan"),
    },
    {
      label: "AI extractions",
      value: formatCount(extractions?.used ?? stats?.extractionCount),
      icon: Cpu,
      change: extractions
        ? `${extractions.used.toLocaleString()}/${extractions.limit.toLocaleString()} this month`
        : "Current period",
    },
    {
      label: "Documents",
      value: formatCount(stats?.documentCount),
      icon: FileText,
      change: stats?.pendingJobs
        ? `${stats.pendingJobs} pending jobs`
        : "Live count",
    },
    {
      label: "API requests / day",
      value: formatCount(api?.used),
      icon: BarChart3,
      change: api
        ? `${api.used.toLocaleString()}/${api.limit.toLocaleString()} quota`
        : "Current day",
    },
  ];

  const bars = [45, 52, 38, 65, 48, 72, 58];

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-8 pt-16 sm:pt-20">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Usage analytics"
          description={`Track document intelligence and API consumption${usage?.plan?.name ? ` on the ${usage.plan.name} plan` : ""}.`}
        />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {metrics.map((m) => (
                <div key={m.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <m.icon className="w-5 h-5 text-[#2563eb] mb-3" />
                  <p className="text-2xl font-semibold text-gray-900">{m.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{m.label}</p>
                  <p className="text-xs text-emerald-600 font-medium mt-2">{m.change}</p>
                </div>
              ))}
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-6">Weekly activity</h2>
              <div className="flex items-end justify-between gap-2 h-40">
                {bars.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-[#2563eb]/80 rounded-t-md min-h-[4px]"
                      style={{ height: `${h}%` }}
                    />
                    <span className="text-[10px] text-gray-400">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
