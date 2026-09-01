"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, Check, Loader2, MoreVertical, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { withOrgHeaders } from "@/lib/client-api";
import {
  formatPaymentMethodLabel,
  type PaymentMethodSummary,
} from "@/lib/payment-method";

type SessionRow = {
  fingerprint: string;
  device: string;
  location: string;
  createdAt: string;
  updatedAt: string;
  isCurrent: boolean;
};

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function AccountSettings() {
  const router = useRouter();
  const { userData, activeOrgId, activeOrg } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [copiedOrg, setCopiedOrg] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodSummary[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/sessions");
      const data = await res.json();
      if (res.ok) {
        setSessions(data.data || []);
      } else {
        toast.error(data.error || "Failed to load sessions");
      }
    } catch {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const loadPaymentMethods = useCallback(async () => {
    if (!activeOrgId) {
      setPaymentMethods([]);
      return;
    }
    setBillingLoading(true);
    try {
      const res = await fetch(
        `/api/organisations/${activeOrgId}/billing`,
        withOrgHeaders(activeOrgId)
      );
      const data = await res.json();
      if (res.ok && data.billing) {
        const methods =
          data.billing.paymentMethods?.length
            ? data.billing.paymentMethods
            : data.billing.paymentMethod
              ? [data.billing.paymentMethod]
              : [];
        setPaymentMethods(methods);
      }
    } catch {
      setPaymentMethods([]);
    } finally {
      setBillingLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    void loadPaymentMethods();
  }, [loadPaymentMethods]);

  const logoutAll = async () => {
    if (
      !window.confirm(
        "Log out of all devices? You will need to sign in again on every device."
      )
    ) {
      return;
    }
    setLoggingOutAll(true);
    try {
      const res = await fetch("/api/user/logout-all", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Logout failed");
      toast.success("Logged out everywhere");
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Logout failed");
    } finally {
      setLoggingOutAll(false);
    }
  };

  const revokeSession = async (fingerprint: string, isCurrent: boolean) => {
    setRevokingId(fingerprint);
    setMenuOpen(null);
    try {
      const res = await fetch(
        `/api/user/sessions/${encodeURIComponent(fingerprint)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to terminate session");
      toast.success("Session terminated");
      if (isCurrent) {
        router.push("/login");
        return;
      }
      void loadSessions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to terminate");
    } finally {
      setRevokingId(null);
    }
  };

  const deleteAccount = async () => {
    const email = userData?.email || "your account";
    if (
      !window.confirm(
        `Delete ${email}? This permanently removes your account and revokes all sessions. This cannot be undone.`
      )
    ) {
      return;
    }
    const typed = window.prompt('Type "DELETE" to confirm account deletion');
    if (typed !== "DELETE") {
      toast.error("Confirmation did not match");
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("/api/user/account", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      toast.success("Account deleted");
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const copyOrgId = async () => {
    if (!activeOrgId) return;
    await navigator.clipboard.writeText(activeOrgId);
    setCopiedOrg(true);
    toast.success("Organisation ID copied");
    setTimeout(() => setCopiedOrg(false), 1500);
  };

  return (
    <div className="flex flex-col gap-12 animate-in fade-in duration-300">
      <section className="flex flex-col gap-6">
        <h2 className="text-base font-semibold text-black dark:text-slate-100 border-b border-gray-200 dark:border-zinc-800 pb-2">
          Account
        </h2>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between pb-6 gap-4">
            <div>
              <span className="text-sm font-medium text-black dark:text-slate-100">
                Log out of all devices
              </span>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Ends every active session, including this browser.
              </p>
            </div>
            <button
              type="button"
              disabled={loggingOutAll}
              onClick={() => void logoutAll()}
              className="px-4 py-2 text-sm font-medium text-black dark:text-slate-100 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50 shrink-0"
            >
              {loggingOutAll ? "Logging out…" : "Log out all"}
            </button>
          </div>

          <div className="flex items-center justify-between pb-6 gap-4">
            <div>
              <span className="text-sm font-medium text-red-600">
                Delete your account
              </span>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Permanently removes your profile and organisation memberships.
              </p>
            </div>
            <button
              type="button"
              disabled={deleting}
              onClick={() => void deleteAccount()}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shadow-sm disabled:opacity-50 shrink-0"
            >
              {deleting ? "Deleting…" : "Delete account"}
            </button>
          </div>

          <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-zinc-800 gap-4">
            <span className="text-sm font-medium text-black dark:text-slate-100">
              Organisation ID
            </span>
            <div className="flex items-center gap-2 bg-[#f5f5f5] dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700">
              <span className="text-xs font-mono text-gray-500 dark:text-slate-400 max-w-[180px] truncate">
                {activeOrgId || "—"}
              </span>
              {activeOrgId && (
                <button
                  type="button"
                  onClick={() => void copyOrgId()}
                  className="p-1 text-gray-400 hover:text-black dark:hover:text-white"
                  title="Copy ID"
                >
                  {copiedOrg ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>

          {activeOrg && (
            <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-zinc-800">
              <span className="text-sm font-medium text-black dark:text-slate-100">
                Organisation
              </span>
              <span className="text-sm text-gray-600 dark:text-slate-400">
                {activeOrg.name} · {activeOrg.role}
              </span>
            </div>
          )}

          {userData?.email && (
            <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-zinc-800">
              <span className="text-sm font-medium text-black dark:text-slate-100">
                Email
              </span>
              <span className="text-sm text-gray-600 dark:text-slate-400">
                {userData.email}
              </span>
            </div>
          )}

          {userData?.userId && (
            <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-zinc-800">
              <span className="text-sm font-medium text-black dark:text-slate-100">
                User ID
              </span>
              <span className="text-xs font-mono text-gray-500 dark:text-slate-400">
                {userData.userId}
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 pb-2 gap-4">
          <h2 className="text-base font-semibold text-black dark:text-slate-100">
            Payment methods
          </h2>
          <Link
            href="/settings/billing"
            className="text-sm text-[#2563eb] hover:underline shrink-0"
          >
            Manage billing
          </Link>
        </div>

        {billingLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#2563eb]" />
          </div>
        ) : paymentMethods.length > 0 ? (
          <ul className="divide-y divide-gray-100 dark:divide-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-800">
            {paymentMethods.map((method, idx) => (
              <li
                key={`${method.brand}-${method.last4}-${idx}`}
                className="flex items-center gap-3 px-4 py-3.5"
              >
                <div className="w-10 h-7 rounded bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-zinc-300 uppercase shrink-0">
                  {(method.brand || method.type || "CARD").slice(0, 4)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-800 dark:text-slate-200">
                    {formatPaymentMethodLabel(method)}
                  </p>
                  {activeOrg && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      {activeOrg.name}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800 px-4 py-8 text-sm text-gray-500 dark:text-slate-400">
            <CreditCard className="w-5 h-5 shrink-0 opacity-60" />
            <span>
              No saved payment methods.{" "}
              <Link href="/settings/billing" className="text-[#2563eb] hover:underline">
                Add one when upgrading
              </Link>
            </span>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-black dark:text-slate-100 pb-2">
          Active sessions
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400 py-6">
            No active sessions found.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-zinc-800">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead className="text-[13px] font-medium text-black dark:text-slate-200 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-900/50">
                <tr>
                  <th className="py-3 px-4 font-medium">Device</th>
                  <th className="py-3 px-4 font-medium">Location</th>
                  <th className="py-3 px-4 font-medium">Created</th>
                  <th className="py-3 px-4 font-medium">Last active</th>
                  <th className="py-3 w-12 px-2" />
                </tr>
              </thead>
              <tbody className="text-[13px] text-gray-600 dark:text-slate-400 divide-y divide-gray-100 dark:divide-zinc-800">
                {sessions.map((session) => (
                  <tr key={session.fingerprint} className="group bg-white dark:bg-transparent">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 font-medium text-black dark:text-slate-100">
                        {session.device}
                        {session.isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#2563eb]/10 text-[#2563eb] uppercase tracking-wide">
                            Current
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-500">{session.location}</td>
                    <td className="py-4 px-4 text-gray-500">
                      {formatWhen(session.createdAt)}
                    </td>
                    <td className="py-4 px-4 text-gray-500">
                      {formatWhen(session.updatedAt)}
                    </td>
                    <td className="py-4 px-2 text-right relative">
                      {!session.isCurrent && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setMenuOpen(
                                menuOpen === session.fingerprint
                                  ? null
                                  : session.fingerprint
                              )
                            }
                            className="p-1.5 rounded text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {menuOpen === session.fingerprint && (
                            <div className="absolute right-2 top-full mt-1 w-36 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg py-1 z-10">
                              <button
                                type="button"
                                disabled={revokingId === session.fingerprint}
                                onClick={() =>
                                  void revokeSession(session.fingerprint, false)
                                }
                                className="w-full text-left px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
                              >
                                {revokingId === session.fingerprint
                                  ? "Terminating…"
                                  : "Terminate"}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
