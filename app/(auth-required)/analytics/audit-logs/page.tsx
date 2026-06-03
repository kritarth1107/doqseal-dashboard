"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { History, Search } from "lucide-react";

const logs = [
  { time: "10:42 AM", actor: "kritarth@company.com", action: "API key created", resource: "prod_freelancer_key", ip: "192.168.1.38" },
  { time: "10:15 AM", actor: "alex@freelance.io", action: "Document signed", resource: "env-2", ip: "203.0.113.12" },
  { time: "09:58 AM", actor: "system", action: "AI extraction completed", resource: "MSA_Acme.pdf", ip: "—" },
  { time: "Yesterday", actor: "kritarth@company.com", action: "Member invited", resource: "alex@freelance.io", ip: "192.168.1.38" },
  { time: "Yesterday", actor: "kritarth@company.com", action: "Organisation switched", resource: "Acme Workspace", ip: "192.168.1.38" },
];

export default function AuditLogsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-8 pt-16 sm:pt-20">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Audit logs"
          description="Immutable activity trail for compliance, security reviews, and DPDP accountability."
        />
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Filter by actor, action, or resource…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#2563eb]"
          />
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase border-b border-gray-100">
            <div className="col-span-2">Time</div>
            <div className="col-span-3">Actor</div>
            <div className="col-span-3">Action</div>
            <div className="col-span-3">Resource</div>
            <div className="col-span-1">IP</div>
          </div>
          {logs.map((log, i) => (
            <div
              key={i}
              className="grid grid-cols-12 gap-2 px-4 py-3 text-sm border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
            >
              <div className="col-span-2 text-gray-500 flex items-center gap-1">
                <History className="w-3.5 h-3.5 hidden sm:inline" />
                {log.time}
              </div>
              <div className="col-span-3 truncate text-gray-800">{log.actor}</div>
              <div className="col-span-3 text-gray-700">{log.action}</div>
              <div className="col-span-3 truncate text-gray-500 font-mono text-xs">{log.resource}</div>
              <div className="col-span-1 truncate text-gray-400 text-xs">{log.ip}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
