"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { BarChart3, Cpu, FileText, Loader2, PenLine } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { withOrgHeaders } from "@/lib/client-api";

type OrgStats = {
  documentCount?: number;
  extractionCount?: number;
  pendingJobs?: number;
};

type UsageData = {
  uploadCount?: number;
  limit?: number;
  quotas?: { name: string; used: number; limit: number }[];
};

function formatCount(value?: number) {
  if (value === undefined || value === null) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
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

  const apiUsed =
    usage?.quotas?.find((q) => q.name.toLowerCase().includes("api"))?.used ??
    usage?.uploadCount ??
    0;
  const apiLimit =
    usage?.quotas?.find((q) => q.name.toLowerCase().includes("api"))?.limit ??
    usage?.limit ??
    0;

  const metrics = [
    {
      label: "Documents processed",
      value: formatCount(stats?.documentCount),
      icon: FileText,
      change: stats?.documentCount ? "Live count" : "—",
    },
    {
      label: "AI extractions",
      value: formatCount(stats?.extractionCount),
      icon: Cpu,
      change: stats?.extractionCount ? "Live count" : "—",
    },
    {
      label: "Pending jobs",
      value: formatCount(stats?.pendingJobs),
      icon: PenLine,
      change: "In queue",
    },
    {
      label: "Daily uploads",
      value: formatCount(usage?.uploadCount),
      icon: BarChart3,
      change: apiLimit ? `${apiUsed}/${apiLimit} quota` : "Current period",
    },
  ];

  const bars = [45, 52, 38, 65, 48, 72, 58];

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-8 pt-16 sm:pt-20">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Usage analytics"
          description="Track document intelligence, e-sign, and API consumption for your organisation."
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
