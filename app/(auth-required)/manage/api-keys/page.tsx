"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Key,
  Terminal,
  Activity,
  Webhook,
  Copy,
  Check,
  Plus,
  BookOpen,
  X,
  ShieldCheck,
  Calendar,
  Infinity,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import {
  WEBHOOK_EVENTS,
  WEBHOOK_EVENT_CATEGORIES,
  WEBHOOK_EVENT_META,
  WebhookEvent,
} from "@/lib/webhook-events";

interface ApiKeyData {
  _id: string;
  name: string;
  appId: string;
  secretHint: string;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
  expiresAt?: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    avatar?: string;
    email: string;
  };
}

interface GeneratedCredentials {
  appId: string;
  secretKey: string;
}

const tabs = [
  { id: "quickstart", label: "Quickstart", icon: Terminal },
  { id: "keys", label: "Keys", icon: Key },
  { id: "usage", label: "Usage", icon: Activity },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
];

function WebhookToggle({
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
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-[#2563eb]" : "bg-gray-300"
      }`}
    >
      <span
        className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

export default function ApiManagementPage() {
  const { activeOrgId } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    initialTab && tabs.some((t) => t.id === initialTab) ? initialTab : "keys"
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([
    "document.processed",
  ]);
  const [webhookEnabled, setWebhookEnabled] = useState(true);
  const [isLoadingWebhooks, setIsLoadingWebhooks] = useState(true);
  const [isSavingWebhooks, setIsSavingWebhooks] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpiry, setNewKeyExpiry] = useState("");
  const [generatedCredentials, setGeneratedCredentials] =
    useState<GeneratedCredentials | null>(null);

  const fetchApiKeys = useCallback(async () => {
    if (!activeOrgId) return;

    setIsLoadingKeys(true);
    try {
      const response = await fetch(
        `/api/manage/api-keys/get?organisationId=${activeOrgId}`
      );
      const data = await response.json();

      if (response.ok) {
        setApiKeys(data.data || []);
      } else {
        toast.error(data.error || "Failed to load API keys");
      }
    } catch (error) {
      console.error("Fetch keys error:", error);
      toast.error("Error connecting to server");
    } finally {
      setIsLoadingKeys(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const fetchWebhooks = useCallback(async () => {
    if (!activeOrgId) return;
    setIsLoadingWebhooks(true);
    try {
      const response = await fetch(
        `/api/manage/webhooks?organisationId=${activeOrgId}`
      );
      const data = await response.json();
      if (response.ok) {
        const hook = data.data?.webhooks?.[0];
        if (hook?.url) {
          setWebhookUrl(hook.url);
          setWebhookEvents(
            hook.events?.length ? hook.events : ["document.processed"]
          );
          setWebhookEnabled(hook.enabled !== false);
        } else {
          setWebhookUrl("");
          setWebhookEvents(["document.processed"]);
          setWebhookEnabled(true);
        }
      } else {
        toast.error(data.error || "Failed to load webhooks");
      }
    } catch {
      toast.error("Error loading webhooks");
    } finally {
      setIsLoadingWebhooks(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    if (activeTab === "webhooks") {
      fetchWebhooks();
    }
  }, [activeTab, fetchWebhooks]);

  const saveWebhooks = async () => {
    if (!activeOrgId) return;
    const url = webhookUrl.trim();
    if (url && !webhookEvents.length) {
      toast.error("Select at least one event");
      return;
    }
    setIsSavingWebhooks(true);
    try {
      const response = await fetch("/api/manage/webhooks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organisationId: activeOrgId,
          webhooks: url
            ? [{ url, events: webhookEvents, enabled: webhookEnabled }]
            : [],
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Webhooks saved");
        fetchWebhooks();
      } else {
        toast.error(data.error || data.message || "Failed to save webhooks");
      }
    } catch {
      toast.error("Failed to save webhooks");
    } finally {
      setIsSavingWebhooks(false);
    }
  };

  const toggleWebhookEvent = (event: WebhookEvent) => {
    setWebhookEvents((prev) => {
      const has = prev.includes(event);
      if (has) {
        const next = prev.filter((e) => e !== event);
        return next.length ? next : prev;
      }
      return [...prev, event];
    });
  };

  const handleCopy = (text: string, id: string = "default") => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copied to clipboard");
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrgId) {
      toast.error("No active organisation selected");
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/manage/api-keys/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName.trim(),
          organisationId: activeOrgId,
          expiresInDays: newKeyExpiry ? Number(newKeyExpiry) : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.data?.appId && data.data?.secretKey) {
        setGeneratedCredentials({
          appId: data.data.appId,
          secretKey: data.data.secretKey,
        });
        toast.success("API credentials created");
        fetchApiKeys();
      } else {
        toast.error(data.error || data.message || "Failed to create API key");
      }
    } catch (error) {
      console.error("Create API key error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (keyId: string, keyName: string) => {
    if (!activeOrgId) return;
    if (
      !window.confirm(
        `Revoke "${keyName}"? Any integrations using this key will stop working immediately.`
      )
    ) {
      return;
    }

    setRevokingId(keyId);
    try {
      const response = await fetch("/api/manage/api-keys/revoke", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organisationId: activeOrgId, keyId }),
      });
      const data = await response.json();

      if (response.ok) {
        toast.success("API key revoked");
        fetchApiKeys();
      } else {
        toast.error(data.error || data.message || "Failed to revoke key");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setRevokingId(null);
    }
  };

  const resetModal = () => {
    setShowCreateModal(false);
    setGeneratedCredentials(null);
    setNewKeyName("");
    setNewKeyExpiry("");
  };

  const statusBadge = (status: ApiKeyData["status"]) => {
    const styles = {
      ACTIVE: "bg-green-50 text-green-700 border-green-100",
      REVOKED: "bg-red-50 text-red-600 border-red-100",
      EXPIRED: "bg-amber-50 text-amber-700 border-amber-100",
    };
    return (
      <span
        className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border ${styles[status]}`}
      >
        {status.toLowerCase()}
      </span>
    );
  };

  const renderQuickstart = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h3 className="text-lg font-medium text-[#333] mb-2">Getting Started</h3>
        <p className="text-sm text-gray-500 max-w-3xl">
          Authenticate with your <strong>APP ID</strong> and <strong>Secret Key</strong>.
          The secret is shown once at creation — store it securely. Public API endpoints
          will be available soon.
        </p>
      </div>

      <div className="bg-[#1f1f1f] rounded-xl overflow-hidden border border-gray-200 shadow-sm max-w-4xl">
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/40">
          <span className="text-xs font-medium text-gray-400">cURL</span>
          <button
            onClick={() =>
              handleCopy(
                `curl https://api.doqseal.io/v1/documents \\
  -H "X-App-Id: YOUR_APP_ID" \\
  -H "Authorization: Bearer YOUR_SECRET_KEY"`,
                "curl"
              )
            }
            className="text-gray-400 hover:text-white transition-colors"
          >
            {copiedId === "curl" ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
        <div className="p-4 overflow-x-auto text-sm font-mono text-gray-300 leading-relaxed">
          <span className="text-pink-500">curl</span>{" "}
          <span className="text-green-400">https://api.doqseal.io/v1/documents</span>{" "}
          \<br />
          &nbsp;&nbsp;<span className="text-blue-400">-H</span>{" "}
          <span className="text-yellow-300">"X-App-Id: YOUR_APP_ID"</span> \<br />
          &nbsp;&nbsp;<span className="text-blue-400">-H</span>{" "}
          <span className="text-yellow-300">
            "Authorization: Bearer YOUR_SECRET_KEY"
          </span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 max-w-4xl space-y-3">
        <h4 className="text-sm font-medium text-[#333]">Credential format</h4>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              APP ID
            </p>
            <code className="text-xs font-mono text-gray-700">K7X2M9P4Q1W8N3R</code>
            <p className="text-xs text-gray-500 mt-1">
              15-character uppercase alphanumeric identifier. Safe to reference in logs.
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              Secret Key
            </p>
            <code className="text-xs font-mono text-gray-700">aB3xYz9kLm2nPqRs.T8vW2xYz4aBcDe</code>
            <p className="text-xs text-gray-500 mt-1">
              Compact signed token derived from your APP ID. Only the last 6 characters
              are stored for identification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderKeys = () => (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-[#333]">API Keys</h3>
          <p className="text-sm text-gray-500">
            Each key pair includes an APP ID and a one-time secret.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#2563eb] hover:bg-[#1d4ed8] transition-colors rounded-xl shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create key
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[720px]">
            <thead className="text-gray-500 text-xs uppercase font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">APP ID</th>
                <th className="px-6 py-3">Secret</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoadingKeys ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-gray-500 font-medium">
                        Loading your keys...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-gray-50 rounded-full">
                        <Key className="w-5 h-5 text-gray-400" />
                      </div>
                      <span className="text-xs text-gray-500 font-medium">
                        No API keys yet. Create one to get started.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                apiKeys.map((key) => (
                  <tr key={key._id} className="group hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-[#333]">{key.name}</span>
                        <span className="text-[10px] text-gray-400">
                          by {key.createdBy?.name || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 px-2 py-1 rounded-lg text-gray-700 font-mono text-[11px] border border-gray-200">
                          {key.appId}
                        </code>
                        <button
                          onClick={() => handleCopy(key.appId, `app-${key._id}`)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          {copiedId === `app-${key._id}` ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="bg-gray-100 px-2 py-1 rounded-lg text-gray-500 font-mono text-[11px] border border-gray-200">
                        {key.secretHint}
                      </code>
                    </td>
                    <td className="px-6 py-4">{statusBadge(key.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">
                          {new Date(key.createdAt).toLocaleDateString()}
                        </span>
                        {key.expiresAt ? (
                          <span className="text-[10px] text-amber-600 font-medium">
                            Expires {new Date(key.expiresAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-[10px] text-green-600 font-medium flex items-center gap-1">
                            <Infinity className="w-2.5 h-2.5" /> Never
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {key.status === "ACTIVE" && (
                        <button
                          disabled={revokingId === key._id}
                          onClick={() => handleRevoke(key._id, key.name)}
                          className="inline-flex items-center gap-1.5 text-red-500 hover:text-red-600 text-xs font-semibold px-3 py-1.5 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {revokingId === key._id ? "Revoking..." : "Revoke"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderUsage = () => (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      <div>
        <h3 className="text-lg font-medium text-[#333]">Usage Monitoring</h3>
        <p className="text-sm text-gray-500">
          API usage metrics will appear here once public endpoints are enabled.
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center shadow-sm">
        <Activity className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">No usage data yet</p>
      </div>
    </div>
  );

  const renderWebhooks = () => (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl">
      <div>
        <h3 className="text-lg font-medium text-[#333]">Webhooks</h3>
        <p className="text-sm text-gray-500 mt-1">
          One HTTPS endpoint for your entire organisation. DoqSeal POSTs JSON
          when selected events occur across all projects.
        </p>
      </div>

      {isLoadingWebhooks ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#333]">Enable webhook</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Paused endpoints keep their config but won&apos;t receive events.
                </p>
              </div>
              <WebhookToggle
                checked={webhookEnabled && !!webhookUrl.trim()}
                onChange={setWebhookEnabled}
                disabled={!webhookUrl.trim()}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Endpoint URL
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.example.com/doqseal"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-[#2563eb] outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-[#333]">
              Events ({webhookEvents.length} selected)
            </h4>
            {WEBHOOK_EVENT_CATEGORIES.map((category) => {
              const events = WEBHOOK_EVENTS.filter(
                (e) => WEBHOOK_EVENT_META[e].category === category
              );
              return (
                <div key={category} className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                    {category}
                  </p>
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 shadow-sm">
                    {events.map((event) => {
                      const meta = WEBHOOK_EVENT_META[event];
                      const checked = webhookEvents.includes(event);
                      return (
                        <div
                          key={event}
                          className="flex items-center justify-between gap-4 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#333]">
                              {meta.label}
                            </p>
                            <p className="text-xs text-gray-500">{meta.description}</p>
                            <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                              {event}
                            </p>
                          </div>
                          <WebhookToggle
                            checked={checked}
                            onChange={() => toggleWebhookEvent(event)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-[#1f1f1f] rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <div className="px-4 py-2 border-b border-white/10 bg-black/40">
              <span className="text-xs font-medium text-gray-400">Example payload</span>
            </div>
            <pre className="p-4 text-[11px] leading-relaxed overflow-x-auto text-gray-300 font-mono">
{`{
  "event": "document.processed",
  "organisationId": "…",
  "projectId": "…",
  "documentId": "…",
  "status": "completed",
  "timestamp": "ISO-8601"
}`}
            </pre>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void saveWebhooks()}
              disabled={isSavingWebhooks}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-xl disabled:opacity-50 shadow-sm"
            >
              {isSavingWebhooks ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save webhooks
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#f9f9f9] p-4 sm:p-8 custom-scrollbar">
      <div className="max-w-5xl mx-auto flex flex-col">
        <div className="mb-8 mt-2 md:mt-0">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#333] tracking-tight mb-2">
            API Management
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Create APP ID + secret pairs to authenticate with DoqSeal APIs.
          </p>
        </div>

        <div className="flex overflow-x-auto custom-scrollbar border-b border-gray-200 mb-8 pb-px">
          <div className="flex gap-6 min-w-max px-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? "border-black text-black"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-black" : ""}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pb-24">
          {activeTab === "quickstart" && renderQuickstart()}
          {activeTab === "keys" && renderKeys()}
          {activeTab === "usage" && renderUsage()}
          {activeTab === "webhooks" && renderWebhooks()}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={resetModal}
          />

          <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#333]">
                  {generatedCredentials ? "Save your credentials" : "Create API key"}
                </h3>
                <button
                  onClick={resetModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {generatedCredentials ? (
                <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="p-4 bg-amber-50 rounded-2xl flex items-start gap-3 border border-amber-100">
                    <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Copy both values now. The <strong>secret key</strong> is shown
                      only once — we store just its last 6 characters.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                      APP ID
                    </label>
                    <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl p-3 font-mono text-sm">
                      <span className="flex-1 truncate pr-10 text-gray-800">
                        {generatedCredentials.appId}
                      </span>
                      <button
                        onClick={() =>
                          handleCopy(generatedCredentials.appId, "modal-app")
                        }
                        className="absolute right-2 p-2 hover:bg-white rounded-lg transition-colors text-gray-500"
                      >
                        {copiedId === "modal-app" ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                      Secret Key
                    </label>
                    <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl p-3 font-mono text-sm">
                      <span className="flex-1 break-all pr-10 text-gray-800">
                        {generatedCredentials.secretKey}
                      </span>
                      <button
                        onClick={() =>
                          handleCopy(generatedCredentials.secretKey, "modal-secret")
                        }
                        className="absolute right-2 p-2 hover:bg-white rounded-lg transition-colors text-gray-500"
                      >
                        {copiedId === "modal-secret" ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={resetModal}
                    className="w-full py-3.5 bg-black text-white rounded-xl font-bold text-sm"
                  >
                    Done — I&apos;ve saved these
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateKey} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                      Name
                    </label>
                    <input
                      required
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g. Production server"
                      minLength={3}
                      maxLength={50}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-[#2563eb] outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                      Expiry (days)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        value={newKeyExpiry}
                        onChange={(e) => setNewKeyExpiry(e.target.value)}
                        placeholder="Leave empty for never"
                        className="w-full px-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-[#2563eb] outline-none transition-all"
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        {newKeyExpiry ? (
                          <Calendar className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Infinity className="w-4 h-4 text-[#2563eb]" />
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 px-1">
                      {newKeyExpiry
                        ? `Key expires in ${newKeyExpiry} days.`
                        : "Key never expires."}
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={resetModal}
                      className="flex-1 py-3.5 border border-gray-200 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={isCreating || newKeyName.trim().length < 3}
                      type="submit"
                      className="flex-1 py-3.5 bg-black text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isCreating ? "Creating..." : "Create key"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
