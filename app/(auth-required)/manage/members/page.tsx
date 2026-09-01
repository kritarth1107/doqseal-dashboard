"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Users,
  Globe,
  Shield,
  MoreVertical,
  Search,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  Loader2,
  X,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { withOrgHeaders } from "@/lib/client-api";

const tabs = [
  { id: "members", label: "Members & contractors", icon: Users },
  { id: "domains", label: "Domain access", icon: Globe },
  { id: "api-access", label: "API access", icon: Shield },
];

type OrgMember = {
  userId: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: string;
  joinedAt?: string;
};

type OrgInvite = {
  inviteId: string;
  email: string;
  role: string;
  status: string;
  expiresAt?: string;
};

type DomainAccessState = {
  verifiedDomain: string | null;
  isDomainVerified: boolean;
  autoJoinEnabled: boolean;
  domainVerifiedAt: string | null;
  verificationToken: string | null;
  txtRecordHost: string | null;
  txtRecordValue: string | null;
  pendingDomain: string | null;
  adminEmailDomain: string | null;
  adminCanVerifyDomains: boolean;
};

type RowItem =
  | { kind: "member"; id: string; name: string; email: string; role: string; status: "Active"; avatar: string }
  | { kind: "invite"; id: string; name: string; email: string; role: string; status: "Invited"; avatar: string };

const ROLES = ["member", "admin"] as const;

function initials(name: string, email: string) {
  if (name && name !== "Unknown User") {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function formatRole(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

async function copyText(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error("Could not copy");
  }
}

export default function MembersManagementPage() {
  const { activeOrgId, activeOrg, userData } = useAuth();
  const [activeTab, setActiveTab] = useState("members");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoJoin, setAutoJoin] = useState(false);
  const [domain, setDomain] = useState("");
  const [domainState, setDomainState] = useState<DomainAccessState | null>(null);
  const [domainLoading, setDomainLoading] = useState(false);
  const [domainSaving, setDomainSaving] = useState(false);
  const [domainVerifying, setDomainVerifying] = useState(false);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<(typeof ROLES)[number]>("member");
  const [inviting, setInviting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const canManage =
    activeOrg?.role === "owner" || activeOrg?.role === "admin";

  const loadData = useCallback(async () => {
    if (!activeOrgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [orgRes, invitesRes] = await Promise.all([
        fetch(`/api/organisations/${activeOrgId}`, withOrgHeaders(activeOrgId)),
        fetch(`/api/organisations/${activeOrgId}/invites`, withOrgHeaders(activeOrgId)),
      ]);

      const orgData = await orgRes.json();
      const invitesData = await invitesRes.json();

      if (orgRes.ok) {
        setMembers(orgData.organisation?.members || []);
      } else {
        setMembers([]);
      }

      if (invitesRes.ok) {
        setInvites(
          (invitesData.invites || []).filter(
            (inv: OrgInvite) => inv.status === "pending"
          )
        );
      } else {
        setInvites([]);
      }
    } catch {
      setMembers([]);
      setInvites([]);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadDomainSettings = useCallback(async () => {
    if (!activeOrgId || !canManage) return;
    setDomainLoading(true);
    try {
      const res = await fetch(
        `/api/organisations/${activeOrgId}/domain`,
        withOrgHeaders(activeOrgId)
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load domain settings");
      const d = data.domain as DomainAccessState;
      setDomainState(d);
      setAutoJoin(Boolean(d.autoJoinEnabled));
      setDomain(
        d.verifiedDomain ||
          d.pendingDomain ||
          (d.adminCanVerifyDomains ? d.adminEmailDomain || "" : "")
      );
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load domain settings"
      );
    } finally {
      setDomainLoading(false);
    }
  }, [activeOrgId, canManage]);

  useEffect(() => {
    if (activeTab === "domains") {
      loadDomainSettings();
    }
  }, [activeTab, loadDomainSettings]);

  const handleClaimDomain = async () => {
    if (!activeOrgId || !domain.trim()) return;
    setDomainSaving(true);
    try {
      const res = await fetch(
        `/api/organisations/${activeOrgId}/domain/claim`,
        withOrgHeaders(activeOrgId, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain: domain.trim() }),
        })
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to claim domain");
      setDomainState(data.domain);
      toast.success("Add the TXT record below, then verify DNS");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to claim domain");
    } finally {
      setDomainSaving(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!activeOrgId) return;
    setDomainVerifying(true);
    try {
      const res = await fetch(
        `/api/organisations/${activeOrgId}/domain/verify`,
        withOrgHeaders(activeOrgId, { method: "POST" })
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setDomainState(data.domain);
      setAutoJoin(Boolean(data.domain.autoJoinEnabled));
      toast.success("Domain verified — you can enable auto-join");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Verification failed");
    } finally {
      setDomainVerifying(false);
    }
  };

  const handleSaveDomainSettings = async () => {
    if (!activeOrgId) return;
    setDomainSaving(true);
    try {
      const res = await fetch(
        `/api/organisations/${activeOrgId}/domain/settings`,
        withOrgHeaders(activeOrgId, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ autoJoinEnabled: autoJoin }),
        })
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");
      setDomainState(data.domain);
      toast.success(autoJoin ? "Auto-join enabled" : "Auto-join disabled");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setDomainSaving(false);
    }
  };

  const handleReleaseDomain = async () => {
    if (!activeOrgId) return;
    if (!window.confirm("Release this domain? Auto-join will be disabled.")) return;
    setDomainSaving(true);
    try {
      const res = await fetch(
        `/api/organisations/${activeOrgId}/domain`,
        withOrgHeaders(activeOrgId, { method: "DELETE" })
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to release domain");
      setDomainState(data.domain);
      setDomain("");
      setAutoJoin(false);
      toast.success("Domain released");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to release domain");
    } finally {
      setDomainSaving(false);
    }
  };

  const rows: RowItem[] = [
    ...members.map((m) => ({
      kind: "member" as const,
      id: m.userId,
      name: m.name,
      email: m.email,
      role: m.role,
      status: "Active" as const,
      avatar: initials(m.name, m.email),
    })),
    ...invites.map((inv) => ({
      kind: "invite" as const,
      id: inv.inviteId,
      name: inv.email.split("@")[0],
      email: inv.email,
      role: inv.role,
      status: "Invited" as const,
      avatar: inv.email.slice(0, 2).toUpperCase(),
    })),
  ].filter(
    (row) =>
      !searchQuery ||
      row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrgId || !inviteEmail.trim()) return;

    setInviting(true);
    try {
      const res = await fetch(
        `/api/organisations/${activeOrgId}/invites`,
        withOrgHeaders(activeOrgId, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
        })
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invite");

      toast.success("Invite sent");
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteRole("member");
      await loadData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    if (!activeOrgId) return;
    setActionLoading(userId);
    setOpenMenuId(null);
    try {
      const res = await fetch(
        `/api/organisations/${activeOrgId}/members/${userId}`,
        withOrgHeaders(activeOrgId, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        })
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role");
      toast.success("Role updated");
      await loadData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!activeOrgId || userId === userData?.userId) return;
    setActionLoading(userId);
    setOpenMenuId(null);
    try {
      const res = await fetch(
        `/api/organisations/${activeOrgId}/members/${userId}`,
        withOrgHeaders(activeOrgId, { method: "DELETE" })
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove member");
      toast.success("Member removed");
      await loadData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to remove member");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!activeOrgId) return;
    setActionLoading(inviteId);
    setOpenMenuId(null);
    try {
      const res = await fetch(
        `/api/organisations/${activeOrgId}/invites/${inviteId}`,
        withOrgHeaders(activeOrgId, { method: "DELETE" })
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke invite");
      toast.success("Invite revoked");
      await loadData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke invite");
    } finally {
      setActionLoading(null);
    }
  };

  const renderMembers = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#2563eb] transition-colors" />
          <input
            type="text"
            placeholder="Search members by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-1 focus:ring-[#2563eb] transition-all"
          />
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#2563eb] hover:bg-[#1d4ed8] transition-colors rounded-xl shadow-sm whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-transparent text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest border-b border-gray-200 dark:border-white/10">
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                    No members found
                  </td>
                </tr>
              ) : (
                rows.map((member) => (
                  <tr key={`${member.kind}-${member.id}`} className="group hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2563eb] to-[#3b82f6] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                          {member.avatar}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-[#333]">{member.name}</span>
                          <span className="text-xs text-gray-500">{member.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Shield
                          className={`w-3.5 h-3.5 ${
                            member.role === "owner" || member.role === "admin"
                              ? "text-[#2563eb]"
                              : "text-gray-400"
                          }`}
                        />
                        <span className="text-xs font-medium text-gray-600">
                          {formatRole(member.role)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {member.status === "Active" ? (
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        )}
                        <span
                          className={`text-xs font-medium ${
                            member.status === "Active" ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          {member.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      {canManage &&
                        member.role !== "owner" &&
                        (member.kind === "member"
                          ? member.id !== userData?.userId
                          : true) && (
                          <>
                            <button
                              type="button"
                              disabled={actionLoading === member.id}
                              onClick={() =>
                                setOpenMenuId(openMenuId === member.id ? null : member.id)
                              }
                              className="p-1.5 text-gray-400 hover:text-black transition-colors disabled:opacity-50"
                            >
                              {actionLoading === member.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <MoreVertical className="w-4 h-4" />
                              )}
                            </button>
                            {openMenuId === member.id && (
                              <div className="absolute right-6 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 text-left">
                                {member.kind === "member" ? (
                                  <>
                                    {ROLES.map((role) =>
                                      role !== member.role ? (
                                        <button
                                          key={role}
                                          type="button"
                                          onClick={() => handleUpdateRole(member.id, role)}
                                          className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                                        >
                                          Make {formatRole(role)}
                                        </button>
                                      ) : null
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveMember(member.id)}
                                      className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Remove member
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleRevokeInvite(member.id)}
                                    className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Revoke invite
                                  </button>
                                )}
                              </div>
                            )}
                          </>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Invite member</h3>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="contractor@example.com"
                  className="mt-1.5 w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#2563eb]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(e.target.value as (typeof ROLES)[number])
                  }
                  className="mt-1.5 w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#2563eb]"
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {formatRole(role)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#2563eb] rounded-xl hover:bg-[#1d4ed8] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {inviting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderDomains = () => {
    const isVerified = domainState?.isDomainVerified;
    const pending = domainState?.pendingDomain;
    const showTxtInstructions =
      pending && domainState?.txtRecordHost && domainState?.txtRecordValue;
    const adminWorkDomain = domainState?.adminEmailDomain || null;
    const canVerify = domainState?.adminCanVerifyDomains ?? false;
    const domainNormalized = domain.trim().toLowerCase();
    const domainMatchesAdmin =
      Boolean(adminWorkDomain) && domainNormalized === adminWorkDomain;

    return (
      <div className="max-w-2xl space-y-4 animate-in fade-in duration-200">
        {!canManage ? (
          <p className="text-sm text-gray-500">
            Only admins can configure domain auto-access.
          </p>
        ) : domainLoading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Domain auto-access</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Verify via DNS TXT, then allow @{domain || adminWorkDomain || "company.com"}{" "}
                  users to join on login.
                </p>
              </div>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              ) : pending ? (
                <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-md shrink-0">
                  Pending DNS
                </span>
              ) : null}
            </div>

            {!canVerify && (
              <div className="px-4 py-2.5 text-xs text-amber-800 bg-amber-50 border-b border-amber-100">
                Sign in with a work email (not Gmail, Outlook, Yahoo, etc.) to verify
                a company domain. Your account: {userData?.email}
              </div>
            )}

            {canVerify && adminWorkDomain && !isVerified && !pending && (
              <div className="px-4 py-2.5 text-xs text-gray-600 bg-gray-50 border-b border-gray-100">
                You can only verify <strong>@{adminWorkDomain}</strong> — it must match
                your signed-in email ({userData?.email}).
              </div>
            )}

            <div className="px-4 py-3 space-y-3">
              <div>
                <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                  Domain
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    disabled={Boolean(isVerified || pending || (canVerify && adminWorkDomain))}
                    placeholder={adminWorkDomain || "acme.com"}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 disabled:opacity-60"
                  />
                  {!isVerified && !pending && (
                    <button
                      type="button"
                      onClick={handleClaimDomain}
                      disabled={
                        domainSaving ||
                        !domain.trim() ||
                        !canVerify ||
                        !domainMatchesAdmin
                      }
                      className="px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 whitespace-nowrap"
                    >
                      {domainSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                    </button>
                  )}
                </div>
              </div>

              {showTxtInstructions && !isVerified && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
                  <p className="text-xs text-gray-600">
                    Add a TXT record at your DNS provider, then click Check DNS.
                  </p>
                  <div className="space-y-1.5">
                    {[
                      { label: "Host", value: domainState!.txtRecordHost! },
                      { label: "Value", value: domainState!.txtRecordValue! },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-start gap-2 text-xs"
                      >
                        <span className="w-10 shrink-0 text-gray-400 pt-1.5">
                          {row.label}
                        </span>
                        <code className="flex-1 px-2 py-1.5 bg-white border border-gray-200 rounded font-mono text-[11px] break-all">
                          {row.value}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyText(row.value, row.label)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 rounded"
                          title={`Copy ${row.label}`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyDomain}
                    disabled={domainVerifying}
                    className="text-xs font-medium text-gray-900 hover:underline disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {domainVerifying && <Loader2 className="w-3 h-3 animate-spin" />}
                    Check DNS
                  </button>
                </div>
              )}

              {isVerified && (
                <>
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-sm text-gray-900">Auto-join</p>
                      <p className="text-xs text-gray-500">
                        New logins with @{domainState?.verifiedDomain} → Member
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoJoin(!autoJoin)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${
                        autoJoin ? "bg-gray-900" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                          autoJoin ? "left-5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSaveDomainSettings}
                      disabled={domainSaving}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {domainSaving ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleReleaseDomain}
                      disabled={domainSaving}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                    >
                      Release
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <p className="text-[11px] text-gray-400 leading-relaxed px-1">
          Only admins signed in with @{adminWorkDomain || "yourcompany.com"} can verify
          that domain. Gmail, Outlook, Yahoo, and other public providers are blocked.
          DNS TXT on <code className="text-gray-500">_doqseal-verification.yourdomain.com</code>{" "}
          proves ownership.
        </p>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f9f9f9] p-4 sm:p-8 custom-scrollbar pt-20">
      <div className="max-w-5xl mx-auto flex flex-col">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#2563eb]/10 rounded-lg">
              <Users className="w-5 h-5 text-[#2563eb]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#333] tracking-tight">
              Members & Access
            </h1>
          </div>
          <p className="text-gray-500 text-sm sm:text-base max-w-2xl">
            Invite freelancers and developers with scoped roles—sign-only, project access, or full API keys for your document intelligence stack.
          </p>
        </div>

        <div className="flex overflow-x-auto custom-scrollbar border-b border-gray-200 mb-8 pb-px">
          <div className="flex gap-8 min-w-max px-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 pb-4 px-1 border-b-2 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? "border-black text-black"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#2563eb]" : ""}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pb-32">
          {activeTab === "members" && renderMembers()}
          {activeTab === "domains" && renderDomains()}
          {activeTab === "api-access" && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-sm text-gray-600">
              <p className="mb-4">
                Issue per-contractor API keys with organisation scope. Revoke access without affecting production integrations.
              </p>
              <a href="/manage/api-keys" className="inline-flex items-center gap-2 text-[#2563eb] font-medium">
                Manage API keys <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
