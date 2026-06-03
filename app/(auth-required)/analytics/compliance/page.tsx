"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function CompliancePage() {
  const checks = [
    { name: "DPDP data residency", status: "pass", detail: "Processing in approved region" },
    { name: "Encryption at rest", status: "pass", detail: "AES-256 for all stored documents" },
    { name: "E-sign legal framework", status: "pass", detail: "ESIGN / eIDAS aligned workflows" },
    { name: "Member access review", status: "warn", detail: "2 external developers with API access — review quarterly" },
    { name: "Retention policy", status: "pass", detail: "Auto-archive after 7 years (configurable)" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-8 pt-16 sm:pt-20">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Compliance"
          description="DoqSeal helps B2B teams meet DPDP, audit, and e-signature requirements with policy controls and evidence."
          actions={
            <Link
              href="/legal/data-processing-agreement"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg"
            >
              View DPA
            </Link>
          }
        />
        <div className="bg-[#1a1a1a] text-white rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span className="text-3xl font-semibold">98.2%</span>
          </div>
          <p className="text-sm text-gray-400">Organisation compliance score (pilot)</p>
        </div>
        <ul className="space-y-3">
          {checks.map((c) => (
            <li
              key={c.name}
              className="flex items-start gap-4 bg-white border border-gray-200 rounded-xl p-4"
            >
              {c.status === "pass" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-medium text-gray-900">{c.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">{c.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
