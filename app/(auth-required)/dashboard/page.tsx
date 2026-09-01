"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { withOrgHeaders } from "@/lib/client-api";
import { pickDashboardGreeting } from "@/lib/dashboard-greetings";
import {
  FileText,
  ShieldCheck,
  Cpu,
  Clock,
  ArrowUpRight,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Zap,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";

type OrgStats = {
  documentCount?: number;
  documentsCount?: number;
  extractionCount?: number;
  extractionsCount?: number;
  pendingJobs?: number;
  pendingEnvelopes?: number;
  activeProjects?: number;
  trends?: { day: string; count: number }[];
  recentDocuments?: {
    id: string | number;
    name: string;
    type: string;
    status: string;
    confidence: string;
    date: string;
  }[];
};

const DEFAULT_STATS = [
  { label: "Documents in Drive", value: "—", icon: FileText, trend: "—", trendUp: true, color: "blue" as const },
  { label: "AI extractions", value: "—", icon: Cpu, trend: "—", trendUp: true, color: "lime" as const },
  { label: "Jobs pending", value: "—", icon: ShieldCheck, trend: "—", trendUp: false, color: "green" as const },
  { label: "Active projects", value: "—", icon: Clock, trend: "Shared context", trendUp: true, color: "purple" as const },
];

const DEFAULT_TRENDS = [
  { day: "Mon", count: 0 },
  { day: "Tue", count: 0 },
  { day: "Wed", count: 0 },
  { day: "Thu", count: 0 },
  { day: "Fri", count: 0 },
  { day: "Sat", count: 0 },
  { day: "Sun", count: 0 },
];

function formatCount(value?: number) {
  if (value === undefined || value === null) return "—";
  return value.toLocaleString();
}

export default function Dashboard() {
  const { userData, activeOrg, activeOrgId } = useAuth();
  const firstName = userData?.name?.split(" ")[0] || "there";

  const [statsData, setStatsData] = useState<OrgStats | null>(null);
  const [isFreePlan, setIsFreePlan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState(() =>
    pickDashboardGreeting(firstName)
  );

  useEffect(() => {
    setGreeting(pickDashboardGreeting(firstName));
  }, [firstName]);

  useEffect(() => {
    async function loadStats() {
      if (!activeOrgId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [statsRes, usageRes] = await Promise.all([
          fetch(
            `/api/organisations/${activeOrgId}/stats`,
            withOrgHeaders(activeOrgId)
          ),
          fetch(
            `/api/organisations/${activeOrgId}/usage`,
            withOrgHeaders(activeOrgId)
          ),
        ]);
        const data = await statsRes.json();
        if (statsRes.ok) {
          setStatsData(data.stats || null);
        } else {
          setStatsData(null);
        }
        if (usageRes.ok) {
          const usageData = await usageRes.json();
          setIsFreePlan(Boolean(usageData.usage?.plan?.isFree));
        } else {
          setIsFreePlan(false);
        }
      } catch {
        setStatsData(null);
        setIsFreePlan(false);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [activeOrgId]);

  const documentsCount =
    statsData?.documentsCount ?? statsData?.documentCount;
  const extractionsCount =
    statsData?.extractionsCount ?? statsData?.extractionCount;
  const pendingJobs =
    statsData?.pendingJobs ?? statsData?.pendingEnvelopes;
  const activeProjects = statsData?.activeProjects;

  const stats = [
    {
      ...DEFAULT_STATS[0],
      value: formatCount(documentsCount),
      trend: documentsCount != null ? "Live" : "—",
      trendUp: true,
    },
    {
      ...DEFAULT_STATS[1],
      value: formatCount(extractionsCount),
      trend: extractionsCount != null ? "Live" : "—",
      trendUp: true,
    },
    {
      ...DEFAULT_STATS[2],
      value: formatCount(pendingJobs),
      trend: pendingJobs && pendingJobs > 0 ? "In queue" : "Clear",
      trendUp: !(pendingJobs && pendingJobs > 0),
    },
    {
      ...DEFAULT_STATS[3],
      value: formatCount(activeProjects),
      trend: "Shared context",
      trendUp: true,
    },
  ];

  const trends = statsData?.trends?.length ? statsData.trends : DEFAULT_TRENDS;
  const maxTrendCount = Math.max(...trends.map((t) => t.count), 1);

  const recentDocuments = statsData?.recentDocuments?.length
    ? statsData.recentDocuments
    : [];

  return (
    <div className="flex-1 overflow-y-auto bg-[#f9f9f9] p-4 sm:p-8 pt-20">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-50">
              {greeting.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              {activeOrg?.name ? `${activeOrg.name} · ` : ""}
              {greeting.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Export Report
            </button>
            <Link href="/intelligence" className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-[#1d4ed8] flex items-center gap-2 shadow-sm">
              <Zap className="w-4 h-4" />
              Ask AI
            </Link>
          </div>
        </div>

        {isFreePlan && (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                You&apos;re on the Free plan
              </p>
              <p className="text-xs text-amber-800/80 dark:text-amber-200/70 mt-0.5">
                5 MB storage · 2 extractions / month · 0 API calls. Upgrade for more capacity.
              </p>
            </div>
            <Link
              href="/settings/billing"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg shrink-0"
            >
              Upgrade plan
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
            </div>
          ) : (
            stats.map((stat, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2 rounded-xl ${
                    stat.color === "lime" ? "bg-[#2563eb]/20 text-[#2563eb]" :
                    stat.color === "blue" ? "bg-blue-500/10 text-blue-500" :
                    stat.color === "green" ? "bg-emerald-500/10 text-emerald-500" :
                    "bg-purple-500/10 text-purple-500"
                  }`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    stat.trendUp ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                  }`}>
                    {stat.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {stat.trend}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[13px] font-medium text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Charts Section */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Extraction Performance</h3>
                <p className="text-xs text-gray-500">Documents processed per day this week</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg text-xs font-medium text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-[#2563eb]"></span>
                  AI Processed
                </div>
              </div>
            </div>
            <div className="p-6 flex-1 flex items-end justify-between gap-2 h-64 mt-4">
              {trends.map((t, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-3 group">
                  <div
                    className="w-full bg-[#2563eb]/20 rounded-t-lg relative overflow-hidden group-hover:bg-[#2563eb]/30 transition-all cursor-pointer"
                    style={{ height: `${(t.count / maxTrendCount) * 100}%`, minHeight: t.count > 0 ? "8px" : "2px" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10"></div>
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none">
                      {t.count}
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{t.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Card */}
          <div className="bg-[#1a1a1a] text-white rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group shadow-xl">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
                  <ShieldCheck className="w-6 h-6 text-[#2563eb]" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#2563eb]">DPDP Compliance</div>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold tracking-tight">Active Engine</h3>
                <p className="text-sm text-gray-400 max-w-[200px]">Enterprise-grade extraction running for India Compliance.</p>
              </div>
            </div>

            <div className="mt-8 space-y-4 relative z-10">
              <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                <div className="bg-[#2563eb] h-full w-[98%]" />
              </div>
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-gray-400">System Health</span>
                <span className="text-[#2563eb]">Optimized</span>
              </div>
            </div>

            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#2563eb]/10 rounded-full blur-3xl group-hover:bg-[#2563eb]/20 transition-all duration-500"></div>
          </div>
        </div>

        {/* Recent Documents Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Recent Extractions</h3>
            <Link href="/documents" className="text-xs font-medium text-gray-500 hover:text-[#2563eb] transition-colors">View all</Link>
          </div>
          <div className="overflow-x-auto">
            {recentDocuments.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-gray-500">
                No recent extractions yet.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider bg-transparent border-b border-gray-100 dark:border-white/10">
                    <th className="px-6 py-4">Document Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Confidence</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentDocuments.map((doc) => (
                    <tr key={doc.id} className="group hover:bg-gray-50 transition-colors cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-gray-500" />
                          </div>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-black">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-gray-500 px-2 py-1 bg-gray-100 rounded-md">{doc.type}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {doc.status === "Processed" || doc.status === "Signed" || doc.status === "Indexed" ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : doc.status === "Review" || doc.status === "In review" ? (
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                          )}
                          <span className={`text-xs font-medium ${
                            doc.status === "Processed" || doc.status === "Signed" || doc.status === "Indexed" ? "text-emerald-600" :
                            doc.status === "Review" || doc.status === "In review" ? "text-amber-600" : "text-red-600"
                          }`}>{doc.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 w-24">
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-gray-400">{doc.confidence}</span>
                          </div>
                          {!Number.isNaN(parseFloat(doc.confidence)) && (
                            <div className="w-full bg-gray-100 rounded-full h-1">
                              <div
                                className={`h-full rounded-full ${
                                  parseFloat(doc.confidence) > 90 ? "bg-emerald-500" :
                                  parseFloat(doc.confidence) > 80 ? "bg-amber-500" : "bg-red-500"
                                }`}
                                style={{ width: doc.confidence }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-500">{doc.date}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1 text-gray-400 hover:text-black transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
