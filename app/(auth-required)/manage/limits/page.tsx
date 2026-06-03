"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Gauge } from "lucide-react";

const quotas = [
  { name: "Document storage", used: 42, limit: 100, unit: "GB" },
  { name: "AI extractions / month", used: 8200, limit: 25000, unit: "" },
  { name: "E-sign envelopes / month", used: 89, limit: 500, unit: "" },
  { name: "API requests / day", used: 12400, limit: 50000, unit: "" },
];

export default function LimitsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-8 pt-16 sm:pt-20">
      <div className="max-w-3xl mx-auto">
        <PageHeader
          title="Limits & quotas"
          description="Monitor usage across your organisation plan. Upgrade for higher API and AI limits."
        />
        <div className="space-y-4">
          {quotas.map((q) => {
            const pct = Math.round((q.used / q.limit) * 100);
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
      </div>
    </div>
  );
}
