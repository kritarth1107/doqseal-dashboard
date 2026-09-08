"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/components/AuthProvider";
import { withOrgHeaders } from "@/lib/client-api";
import {
  RequestLinkForm,
  emptyFormValues,
  toApiPayload,
} from "@/components/request-links/RequestLinkForm";

export default function NewRequestLinkPage() {
  const { activeOrgId } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<{ projectId: string; name: string }[]>(
    []
  );

  useEffect(() => {
    if (!activeOrgId) return;
    fetch("/api/projects", withOrgHeaders(activeOrgId))
      .then((r) => r.json())
      .then((data) => {
        setProjects(
          (data.projects || []).map(
            (p: { projectId: string; name: string }) => ({
              projectId: p.projectId,
              name: p.name,
            })
          )
        );
      })
      .catch(() => undefined);
  }, [activeOrgId]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-8 pt-16 sm:pt-20">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/request-links"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
        <PageHeader
          title="New request link"
          description="Configure document slots and identity checks, then share a collect URL."
        />
        <RequestLinkForm
          initial={emptyFormValues()}
          projects={projects}
          submitLabel="Create link"
          onSubmit={async (values) => {
            if (!activeOrgId) throw new Error("Select an organisation");
            const res = await fetch(
              "/api/request-links",
              withOrgHeaders(activeOrgId, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(toApiPayload(values)),
              })
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Create failed");
            router.push(`/request-links/${data.data.requestLinkId}`);
          }}
        />
      </div>
    </div>
  );
}
