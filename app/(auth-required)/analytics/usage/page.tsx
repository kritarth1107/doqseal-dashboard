"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { BarChart3, Cpu, FileText, PenLine } from "lucide-react";

export default function AnalyticsUsagePage() {
  const metrics = [
    { label: "Documents processed", value: "12,482", icon: FileText, change: "+12%" },
    { label: "AI extractions", value: "8,291", icon: Cpu, change: "+24%" },
    { label: "Envelopes sent", value: "342", icon: PenLine, change: "+8%" },
    { label: "API calls", value: "1.2M", icon: BarChart3, change: "+31%" },
  ];

  const bars = [45, 52, 38, 65, 48, 72, 58];

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-8 pt-16 sm:pt-20">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Usage analytics"
          description="Track document intelligence, e-sign, and API consumption for your organisation."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((m) => (
            <div key={m.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <m.icon className="w-5 h-5 text-[#2563eb] mb-3" />
              <p className="text-2xl font-semibold text-gray-900">{m.value}</p>
              <p className="text-sm text-gray-500 mt-1">{m.label}</p>
              <p className="text-xs text-emerald-600 font-medium mt-2">{m.change} vs last period</p>
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
      </div>
    </div>
  );
}
