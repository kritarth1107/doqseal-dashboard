"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Users,
  Globe,
  Shield,
  MoreVertical,
  Search,
  ShieldCheck,
  UserPlus,
  AtSign,
  ArrowRight,
  CheckCircle2,
  Loader2,
  X,
  Trash2,
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

export default function MembersManagementPage() {
  const { activeOrgId, activeOrg, userData } = useAuth();
  const [activeTab, setActiveTab] = useState("members");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoJoin, setAutoJoin] = useState(true);
  const [domain, setDomain] = useState("doqseal.io");
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
        if (orgData.organisation?.autoJoinDomain) {
          setDomain(orgData.organisation.autoJoinDomain);
        }
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

  const renderDomains = () => (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#2563eb]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#2563eb]/10 transition-all duration-700" />

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-14 h-14 rounded-2xl bg-[#2563eb]/10 flex items-center justify-center shrink-0">
            <Globe className="w-7 h-7 text-[#2563eb]" />
          </div>
          <div className="flex-1 space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-[#333] mb-2">Domain-based Auto-Access</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Streamline your team&apos;s onboarding by allowing anyone with a specific email domain to automatically join your workspace. New users will be granted immediate access as team members.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Authorized Domain
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g. doqseal.io"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#2563eb] transition-all font-medium"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Default Member Role
                </label>
                <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Member</span>
                  <ShieldCheck className="w-4 h-4 text-[#2563eb]" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#2563eb]/5 rounded-2xl border border-[#2563eb]/20">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#2563eb]" />
                <div>
                  <p className="text-sm font-semibold text-[#333]">Enable auto-registration</p>
                  <p className="text-xs text-gray-500">Allow users with @{domain} to join instantly.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAutoJoin(!autoJoin)}
                className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
                  autoJoin ? "bg-[#2563eb]" : "bg-gray-300"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${
                    autoJoin ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                className="px-6 py-2.5 text-sm font-medium text-white bg-[#2563eb] rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-[#2563eb]/10 flex items-center gap-2"
              >
                Save Configuration
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-blue-500" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-blue-900">Secure by default</h4>
          <p className="text-xs text-blue-700 leading-relaxed">
            Domain-based access only applies to users who verify their email ownership. Administrators still retain full control to revoke access at any time from the Team Members list.
          </p>
        </div>
      </div>
    </div>
  );

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
