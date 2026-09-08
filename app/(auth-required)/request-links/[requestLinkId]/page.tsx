"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  Copy,
  Check,
  ExternalLink,
  FileText,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/components/AuthProvider";
import { withOrgHeaders } from "@/lib/client-api";
import { buildCollectShareUrl } from "@/lib/collect-url";
import {
  RequestLinkForm,
  RequestLinkFormValues,
  toApiPayload,
} from "@/components/request-links/RequestLinkForm";

type Submission = {
  submissionId: string;
  name?: string | null;
  email?: string | null;
  mobile?: string | null;
  createdAt?: string;
  files: {
    requirementId: string;
    documentId: string;
    originalFilename: string;
  }[];
};

export default function RequestLinkDetailPage() {
  const { activeOrgId } = useAuth();
  const params = useParams();
  const requestLinkId = String(params.requestLinkId || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<RequestLinkFormValues | null>(null);
  const [slug, setSlug] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [projects, setProjects] = useState<{ projectId: string; name: string }[]>(
    []
  );
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [copied, setCopied] = useState(false);
  const [prefillName, setPrefillName] = useState("");
  const [prefillEmail, setPrefillEmail] = useState("");
  const [prefillMobile, setPrefillMobile] = useState("");

  const load = useCallback(async () => {
    if (!activeOrgId || !requestLinkId) return;
    setLoading(true);
    setError(null);
    try {
      const [linkRes, subRes, projRes] = await Promise.all([
        fetch(
          `/api/request-links/${requestLinkId}`,
          withOrgHeaders(activeOrgId)
        ),
        fetch(
          `/api/request-links/${requestLinkId}/submissions`,
          withOrgHeaders(activeOrgId)
        ),
        fetch("/api/projects", withOrgHeaders(activeOrgId)),
      ]);
      const linkData = await linkRes.json();
      const subData = await subRes.json();
      const projData = await projRes.json();
      if (!linkRes.ok) throw new Error(linkData.error || "Not found");
      const link = linkData.data;
      setSlug(link.slug);
      setShareUrl(link.shareUrl || buildCollectShareUrl(link.slug));
      setForm({
        title: link.title || "",
        description: link.description || "",
        requirements: (link.requirements || []).map(
          (r: {
            requirementId: string;
            label: string;
            description?: string;
            allowedExtensions?: string[];
            required?: boolean;
          }) => ({
            requirementId: r.requirementId,
            label: r.label,
            description: r.description || "",
            allowedExtensions: (r.allowedExtensions || []).join(","),
            required: r.required !== false,
          })
        ),
        settings: {
          collectName: link.settings?.collectName !== false,
          requireEmail: Boolean(link.settings?.requireEmail),
          requireMobile: Boolean(link.settings?.requireMobile),
          verifyEmail: Boolean(link.settings?.verifyEmail),
          verifyMobile: Boolean(link.settings?.verifyMobile),
        },
        projectId: link.projectId || "",
        expiresAt: link.expiresAt
          ? new Date(link.expiresAt).toISOString().slice(0, 16)
          : "",
        status: link.status,
      });
      setSubmissions(Array.isArray(subData.data) ? subData.data : []);
      setProjects(
        (projData.projects || []).map(
          (p: { projectId: string; name: string }) => ({
            projectId: p.projectId,
            name: p.name,
          })
        )
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, requestLinkId]);

  useEffect(() => {
    load();
  }, [load]);

  const personalizedUrl = buildCollectShareUrl(slug || "…", {
    name: prefillName || undefined,
    email: prefillEmail || undefined,
    mobile: prefillMobile || undefined,
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-8 pt-16 sm:pt-20">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/request-links"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>

        {loading || !form ? (
          <p className="text-sm text-slate-500">
            {error || "Loading…"}
          </p>
        ) : (
          <>
            <PageHeader
              title={form.title}
              description="Edit settings, copy share URLs, and review submissions."
              actions={
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(shareUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Copy share URL
                  </button>
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open
                  </a>
                </div>
              }
            />

            <div className="mb-8 bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Personalized share URL
              </h3>
              <div className="grid sm:grid-cols-3 gap-3">
                <input
                  value={prefillName}
                  onChange={(e) => setPrefillName(e.target.value)}
                  placeholder="Name"
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
                <input
                  value={prefillEmail}
                  onChange={(e) => setPrefillEmail(e.target.value)}
                  placeholder="Email"
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
                <input
                  value={prefillMobile}
                  onChange={(e) => setPrefillMobile(e.target.value)}
                  placeholder="Mobile"
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <code className="text-xs bg-slate-50 border border-slate-100 rounded px-2 py-1 break-all flex-1">
                  {personalizedUrl}
                </code>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(personalizedUrl)}
                  className="text-xs font-medium text-[#2563eb]"
                >
                  Copy
                </button>
              </div>
            </div>

            <RequestLinkForm
              initial={form}
              projects={projects}
              submitLabel="Save changes"
              onSubmit={async (values) => {
                if (!activeOrgId) throw new Error("Select an organisation");
                const res = await fetch(
                  `/api/request-links/${requestLinkId}`,
                  withOrgHeaders(activeOrgId, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(toApiPayload(values)),
                  })
                );
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Update failed");
                await load();
              }}
            />

            <section className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Submissions
              </h2>
              {submissions.length === 0 ? (
                <p className="text-sm text-slate-500">No submissions yet.</p>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  {submissions.map((s) => (
                    <div
                      key={s.submissionId}
                      className="p-4 border-b border-slate-100 last:border-0"
                    >
                      <div className="flex flex-wrap justify-between gap-2 mb-2">
                        <div>
                          <p className="font-medium text-slate-900 text-sm">
                            {s.name || s.email || s.mobile || "Anonymous"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {[s.email, s.mobile].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <p className="text-xs text-slate-400">
                          {s.createdAt
                            ? new Date(s.createdAt).toLocaleString()
                            : ""}
                        </p>
                      </div>
                      <ul className="space-y-1">
                        {s.files.map((f) => (
                          <li key={f.documentId}>
                            <Link
                              href={`/view/${f.documentId}`}
                              className="inline-flex items-center gap-1.5 text-xs text-[#2563eb] hover:underline"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              {f.originalFilename}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
