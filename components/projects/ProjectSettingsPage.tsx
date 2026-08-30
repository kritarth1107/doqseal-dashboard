"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  MessageSquare,
  Save,
  Settings as SettingsIcon,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { withOrgHeaders } from "@/lib/client-api";
import {
  ProjectWebhook,
  WEBHOOK_EVENT_META,
  WEBHOOK_EVENTS,
  WebhookEvent,
} from "@/lib/webhook-events";

type Project = {
  projectId: string;
  organisationId?: string;
  name: string;
  description?: string;
  extractionHint?: string;
  webhooks?: ProjectWebhook[];
  webhookUrls?: string[];
  sharedWithOrganisation?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
};

function webhookFromProject(project: Project): {
  url: string;
  events: WebhookEvent[];
  enabled: boolean;
} {
  const first = project.webhooks?.[0];
  if (first?.url) {
    return {
      url: first.url,
      events: (first.events?.length
        ? first.events
        : ["document.processed"]) as WebhookEvent[],
      enabled: first.enabled !== false,
    };
  }
  const legacy = project.webhookUrls?.[0];
  if (legacy) {
    return {
      url: legacy,
      events: ["document.processed"],
      enabled: true,
    };
  }
  return { url: "", events: ["document.processed"], enabled: true };
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none transition-colors disabled:opacity-50 ${
        checked ? "bg-[#2563eb]" : "bg-gray-300 dark:bg-zinc-600"
      }`}
    >
      <span
        className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-[8px]" : "-translate-x-[8px]"
        }`}
      />
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-semibold text-black dark:text-slate-100 border-b border-gray-200 dark:border-zinc-800 pb-2">
      {children}
    </h2>
  );
}

function SaveBar({
  saving,
  disabled,
  onSave,
  label = "Save changes",
}: {
  saving: boolean;
  disabled?: boolean;
  onSave: () => void;
  label?: string;
}) {
  return (
    <div className="sticky bottom-0 -mx-1 pt-6 mt-2 bg-gradient-to-t from-[#f9f9f9] dark:from-[#0b1220] via-[#f9f9f9]/95 dark:via-[#0b1220]/95 to-transparent">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || disabled}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-[#1d4ed8] disabled:opacity-50 shadow-sm"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {label}
        </button>
      </div>
    </div>
  );
}

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { activeOrgId } = useAuth();
  const projectId = String(params.projectId);
  const tabParam = params.tab;
  const activeTabId = Array.isArray(tabParam)
    ? tabParam[0] || "general"
    : typeof tabParam === "string"
      ? tabParam
      : "general";

  const tabs = [
    { id: "general", label: "General", path: `/projects/${projectId}/settings` },
    {
      id: "extraction",
      label: "Extraction",
      path: `/projects/${projectId}/settings/extraction`,
    },
    {
      id: "automations",
      label: "Automations",
      path: `/projects/${projectId}/settings/automations`,
    },
    {
      id: "access",
      label: "Access",
      path: `/projects/${projectId}/settings/access`,
    },
    {
      id: "danger",
      label: "Danger zone",
      path: `/projects/${projectId}/settings/danger`,
    },
  ];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<Project | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [extractionHint, setExtractionHint] = useState("");
  const [shareWithOrg, setShareWithOrg] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([
    "document.processed",
  ]);
  const [webhookEnabled, setWebhookEnabled] = useState(true);
  const [copied, setCopied] = useState(false);

  const applyProject = (p: Project) => {
    setProject(p);
    setName(p.name || "");
    setDescription(p.description || "");
    setExtractionHint(p.extractionHint || "");
    setShareWithOrg(p.sharedWithOrganisation !== false);
    const hook = webhookFromProject(p);
    setWebhookUrl(hook.url);
    setWebhookEvents(hook.events);
    setWebhookEnabled(hook.enabled);
  };

  const load = useCallback(async () => {
    if (!activeOrgId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}`,
        withOrgHeaders(activeOrgId)
      );
      if (!res.ok) throw new Error("Project not found");
      const data = await res.json();
      applyProject(data.project as Project);
    } catch {
      toast.error("Could not load project settings");
      router.replace("/projects");
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, projectId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchProject = async (body: Record<string, unknown>, successMsg: string) => {
    if (!activeOrgId) return null;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}`,
        withOrgHeaders(activeOrgId, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      if (data.project) applyProject(data.project as Project);
      toast.success(successMsg);
      return data.project as Project;
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const saveGeneral = () => {
    if (name.trim().length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    void patchProject(
      { name: name.trim(), description: description.trim() },
      "General settings saved"
    );
  };

  const saveExtraction = () => {
    void patchProject(
      { extractionHint: extractionHint.trim() },
      "Extraction context saved"
    );
  };

  const saveAutomations = () => {
    const url = webhookUrl.trim();
    if (url && !webhookEvents.length) {
      toast.error("Select at least one webhook event");
      return;
    }
    void patchProject(
      {
        webhooks: url
          ? [{ url, events: webhookEvents, enabled: webhookEnabled }]
          : [],
      },
      "Automations saved"
    );
  };

  const saveAccess = () => {
    void patchProject(
      { sharedWithOrganisation: shareWithOrg },
      "Access settings saved"
    );
  };

  const toggleEvent = (event: WebhookEvent) => {
    setWebhookEvents((prev) => {
      const has = prev.includes(event);
      if (has) {
        const next = prev.filter((e) => e !== event);
        return next.length ? next : prev;
      }
      return [...prev, event];
    });
  };

  const copyId = async () => {
    await navigator.clipboard.writeText(projectId);
    setCopied(true);
    toast.success("Project ID copied");
    setTimeout(() => setCopied(false), 1500);
  };

  const archiveProject = async () => {
    const next = project?.status === "archived" ? "active" : "archived";
    await patchProject(
      { status: next },
      next === "archived" ? "Project archived" : "Project restored"
    );
  };

  const deleteProject = async () => {
    if (
      !confirm(
        `Delete "${name}" permanently?\n\nDocuments stay in storage history where applicable, but this project will disappear from your list.`
      )
    ) {
      return;
    }
    const typed = window.prompt(`Type the project name to confirm:\n${name}`);
    if (typed !== name) {
      toast.error("Name did not match — delete cancelled");
      return;
    }
    const ok = await patchProject({ deleteProject: true }, "Project deleted");
    if (ok) router.push("/projects");
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f9f9f9] dark:bg-[#0b1220]">
        <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
      </div>
    );
  }

  const knownTab = tabs.some((t) => t.id === activeTabId);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f9f9f9] dark:bg-[#0b1220] overflow-hidden text-[#333] dark:text-slate-100 font-sans">
      <div className="flex-1 overflow-y-auto w-full">
        <div className="max-w-[1000px] mx-auto px-6 py-10 sm:py-12 flex flex-col md:flex-row gap-10 md:gap-12">
          {/* Sidebar */}
          <div className="w-full md:w-56 shrink-0 flex flex-col gap-5">
            <div>
              <Link
                href={`/projects/${projectId}`}
                className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 mb-3 px-3"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to project
              </Link>
              <h1 className="text-xl font-medium tracking-tight px-3">
                Project settings
              </h1>
              <p className="text-xs text-gray-500 dark:text-slate-400 px-3 mt-1 line-clamp-2">
                {project?.name}
              </p>
            </div>
            <nav className="flex md:flex-col gap-1 md:gap-0.5 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
              {tabs.map((tab) => {
                const isActive = activeTabId === tab.id;
                return (
                  <Link
                    key={tab.id}
                    href={tab.path}
                    className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-950/50 text-[#2563eb]"
                        : "text-gray-600 dark:text-slate-400 hover:bg-gray-200/50 dark:hover:bg-zinc-800/60 hover:text-gray-900 dark:hover:text-slate-100"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 w-full max-w-3xl min-w-0 pb-24">
            {activeTabId === "general" && (
              <div className="flex flex-col gap-12 animate-in fade-in duration-300">
                <section className="flex flex-col gap-5">
                  <SectionTitle>Project details</SectionTitle>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                      Name
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="What documents belong in this workspace?"
                      className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-slate-100 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563eb] resize-y placeholder-gray-400"
                    />
                  </div>
                  <SaveBar saving={saving} onSave={saveGeneral} />
                </section>

                <section className="flex flex-col gap-5">
                  <SectionTitle>Identifiers</SectionTitle>
                  <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-zinc-800">
                    <div>
                      <p className="text-sm font-medium text-black dark:text-slate-100">
                        Project ID
                      </p>
                      <p className="text-[13px] text-gray-500 dark:text-slate-400">
                        Use this when calling APIs or configuring integrations.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-[#f5f5f5] dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700">
                      <span className="text-xs font-mono text-gray-500 dark:text-slate-400 max-w-[140px] sm:max-w-[220px] truncate">
                        {projectId}
                      </span>
                      <button
                        type="button"
                        onClick={() => void copyId()}
                        className="p-1 text-gray-400 hover:text-black dark:hover:text-white"
                        title="Copy ID"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-zinc-800">
                    <span className="text-sm font-medium text-black dark:text-slate-100">
                      Status
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      {project?.status || "active"}
                    </span>
                  </div>
                  {project?.updatedAt && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-medium text-black dark:text-slate-100">
                        Last updated
                      </span>
                      <span className="text-sm text-gray-500 dark:text-slate-400">
                        {new Date(project.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </section>

                <section className="flex flex-col gap-4">
                  <SectionTitle>Shortcuts</SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/projects/${projectId}`}
                      className="px-4 py-2 text-sm font-medium text-black dark:text-slate-100 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 shadow-sm"
                    >
                      Open project
                    </Link>
                    <Link
                      href={`/intelligence?project=${projectId}`}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-[#1d4ed8] shadow-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Chat with project
                    </Link>
                  </div>
                </section>
              </div>
            )}

            {activeTabId === "extraction" && (
              <div className="flex flex-col gap-12 animate-in fade-in duration-300">
                <section className="flex flex-col gap-5">
                  <SectionTitle>Extraction context</SectionTitle>
                  <p className="text-[13px] text-gray-500 dark:text-slate-400 -mt-2">
                    Sent to the AI engine for every file uploaded to this
                    project. Describe checklist items, stamps, fields, or
                    verification rules — the worker loads this from Mongo when
                    each job runs.
                  </p>
                  <textarea
                    value={extractionHint}
                    onChange={(e) => setExtractionHint(e.target.value)}
                    rows={10}
                    className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-slate-100 rounded-lg px-3 py-3 text-sm font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#2563eb] resize-y placeholder-gray-400"
                    placeholder={`Kindly review the documents and ensure the following details are checked:\n\nCenter Stamp\nPatient Name\nAge\nSex\nClinical History`}
                  />
                  <div className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 space-y-2">
                    <p className="text-sm font-medium text-black dark:text-slate-100">
                      Tips
                    </p>
                    <ul className="text-[13px] text-gray-500 dark:text-slate-400 space-y-1.5 list-disc pl-4">
                      <li>
                        Prefer a clear checklist — one item per line or
                        comma-separated.
                      </li>
                      <li>
                        Mention stamps/signatures if presence matters (AI maps
                        them to true/false).
                      </li>
                      <li>
                        Changes apply to the next upload; already-processed
                        files keep their prior extraction.
                      </li>
                    </ul>
                  </div>
                  <SaveBar saving={saving} onSave={saveExtraction} />
                </section>
              </div>
            )}

            {activeTabId === "automations" && (
              <div className="flex flex-col gap-12 animate-in fade-in duration-300">
                <section className="flex flex-col gap-5">
                  <SectionTitle>Webhook</SectionTitle>
                  <p className="text-[13px] text-gray-500 dark:text-slate-400 -mt-2">
                    One HTTPS endpoint per project. DoqSeal POSTs a JSON payload
                    when selected lifecycle events fire.
                  </p>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-black dark:text-slate-100">
                        Enable webhook
                      </span>
                      <span className="text-[13px] text-gray-500 dark:text-slate-400">
                        When off, the URL is saved but events are not delivered.
                      </span>
                    </div>
                    <Toggle
                      checked={webhookEnabled && !!webhookUrl.trim()}
                      onChange={setWebhookEnabled}
                      disabled={!webhookUrl.trim()}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                      Endpoint URL
                    </label>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://hooks.example.com/doqseal"
                      className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    <span className="text-sm font-medium text-black dark:text-slate-100">
                      Events
                    </span>
                    <div className="flex flex-col divide-y divide-gray-100 dark:divide-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
                      {WEBHOOK_EVENTS.map((event) => {
                        const meta = WEBHOOK_EVENT_META[event];
                        const checked = webhookEvents.includes(event);
                        return (
                          <div
                            key={event}
                            className="flex items-center justify-between gap-4 px-4 py-3"
                          >
                            <div>
                              <p className="text-sm font-medium text-black dark:text-slate-100">
                                {meta.label}
                              </p>
                              <p className="text-[13px] text-gray-500 dark:text-slate-400">
                                {meta.description}
                              </p>
                              <p className="text-[11px] font-mono text-gray-400 mt-0.5">
                                {event}
                              </p>
                            </div>
                            <Toggle
                              checked={checked}
                              onChange={() => toggleEvent(event)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <SaveBar saving={saving} onSave={saveAutomations} />
                </section>

                <section className="flex flex-col gap-4">
                  <SectionTitle>Payload</SectionTitle>
                  <p className="text-[13px] text-gray-500 dark:text-slate-400 -mt-1">
                    Headers include{" "}
                    <code className="text-xs bg-gray-100 dark:bg-zinc-800 px-1 rounded">
                      X-DoqSeal-Event
                    </code>
                    . Example body on success:
                  </p>
                  <pre className="text-[11px] leading-relaxed overflow-x-auto rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 text-gray-600 dark:text-slate-300 font-mono">
                    {`{
  "event": "document.processed",
  "projectId": "${projectId}",
  "documentId": "…",
  "jobId": "…",
  "organisationId": "…",
  "status": "completed",
  "originalFilename": "file.pdf",
  "displayTitle": "…",
  "extraction": { "data": {}, "strategy": "pdf_text" },
  "timestamp": "ISO-8601"
}`}
                  </pre>
                </section>
              </div>
            )}

            {activeTabId === "access" && (
              <div className="flex flex-col gap-12 animate-in fade-in duration-300">
                <section className="flex flex-col gap-5">
                  <SectionTitle>Visibility</SectionTitle>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1 max-w-md">
                      <span className="text-sm font-medium text-black dark:text-slate-100">
                        Share with organisation
                      </span>
                      <span className="text-[13px] text-gray-500 dark:text-slate-400">
                        {shareWithOrg
                          ? "All members of your active organisation can open this project and use its documents in AI context."
                          : "Only you can see this project and its documents within the organisation."}
                      </span>
                    </div>
                    <Toggle checked={shareWithOrg} onChange={setShareWithOrg} />
                  </div>
                  <SaveBar saving={saving} onSave={saveAccess} />
                </section>

                <section className="flex flex-col gap-4">
                  <SectionTitle>Members</SectionTitle>
                  <p className="text-[13px] text-gray-500 dark:text-slate-400">
                    Project access follows organisation membership. Invite people
                    from organisation manage.
                  </p>
                  <Link
                    href="/manage/members"
                    className="self-start px-4 py-2 text-sm font-medium text-black dark:text-slate-100 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 shadow-sm"
                  >
                    Manage members
                  </Link>
                </section>
              </div>
            )}

            {activeTabId === "danger" && (
              <div className="flex flex-col gap-12 animate-in fade-in duration-300">
                <section className="flex flex-col gap-6">
                  <SectionTitle>Danger zone</SectionTitle>

                  <div className="flex items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-zinc-800">
                    <div>
                      <p className="text-sm font-medium text-black dark:text-slate-100">
                        {project?.status === "archived"
                          ? "Restore project"
                          : "Archive project"}
                      </p>
                      <p className="text-[13px] text-gray-500 dark:text-slate-400 max-w-md">
                        Archived projects leave the active list. Stay on this
                        page to restore, or reopen settings via a saved link.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void archiveProject()}
                      className="px-4 py-2 text-sm font-medium text-black dark:text-slate-100 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 shadow-sm shrink-0"
                    >
                      {project?.status === "archived" ? "Restore" : "Archive"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-red-600">
                        Delete project
                      </p>
                      <p className="text-[13px] text-gray-500 dark:text-slate-400 max-w-md">
                        Soft-deletes the project so it no longer appears in your
                        organisation. This cannot be undone from the UI.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void deleteProject()}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 shadow-sm shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </section>
              </div>
            )}

            {!knownTab && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-300 h-full justify-center items-center py-20 opacity-50">
                <SettingsIcon className="w-12 h-12 text-gray-300 mb-2" />
                <h2 className="text-xl font-medium">Unknown settings tab</h2>
                <p className="text-sm text-gray-500 text-center max-w-sm">
                  Use the sidebar to open General, Extraction, Automations,
                  Access, or Danger zone.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
