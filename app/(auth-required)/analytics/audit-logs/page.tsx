"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { History, Loader2, Search } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { withOrgHeaders } from "@/lib/client-api";

type AuditEvent = {
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown> | null;
  timestamp: string;
};

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  return date.toLocaleDateString();
}

function formatAction(action: string) {
  return action
    .replace(/[._]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AuditLogsPage() {
  const { activeOrgId } = useAuth();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadEvents() {
      if (!activeOrgId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(
          `/api/organisations/${activeOrgId}/audit-events?limit=50`,
          withOrgHeaders(activeOrgId)
        );
        const data = await res.json();
        if (res.ok) {
          setEvents(data.events || []);
        } else {
          setEvents([]);
        }
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [activeOrgId]);

  const filtered = events.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const resource = `${log.resourceType}:${log.resourceId}`;
    return (
      log.actorId.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      resource.toLowerCase().includes(q)
    );
  });

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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#2563eb]"
          />
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-transparent text-[11px] font-semibold text-gray-500 dark:text-slate-500 uppercase border-b border-gray-100 dark:border-white/10">
            <div className="col-span-2">Time</div>
            <div className="col-span-3">Actor</div>
            <div className="col-span-3">Action</div>
            <div className="col-span-4">Resource</div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-500">No audit events found</div>
          ) : (
            filtered.map((log, i) => (
              <div
                key={`${log.timestamp}-${i}`}
                className="grid grid-cols-12 gap-2 px-4 py-3 text-sm border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
              >
                <div className="col-span-2 text-gray-500 flex items-center gap-1">
                  <History className="w-3.5 h-3.5 hidden sm:inline" />
                  {formatTime(log.timestamp)}
                </div>
                <div className="col-span-3 truncate text-gray-800">{log.actorId}</div>
                <div className="col-span-3 text-gray-700">{formatAction(log.action)}</div>
                <div className="col-span-4 truncate text-gray-500 font-mono text-xs">
                  {log.resourceType}:{log.resourceId}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
