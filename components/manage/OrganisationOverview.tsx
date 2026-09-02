"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { withOrgHeaders } from "@/lib/client-api";
import { resolveMediaUrl } from "@/lib/media-url";

type OrgAddress = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

type OrgDetails = {
  organisationId: string;
  name: string;
  website?: string | null;
  logoUrl?: string | null;
  gstNumber?: string | null;
  address?: OrgAddress | null;
  memberCount?: number;
};

function canManageOrg(role?: string) {
  return role === "owner" || role === "admin";
}

function formatAddress(address?: OrgAddress | null) {
  if (!address) return null;
  const parts = [
    address.line1,
    address.line2,
    [address.city, address.state].filter(Boolean).join(", "),
    address.postalCode,
    address.country,
  ].filter((p) => p && String(p).trim());
  return parts.length ? parts.join(" · ") : null;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-gray-800 dark:text-zinc-200 break-words">
        {value?.trim() ? value : "—"}
      </p>
    </div>
  );
}

export function OrganisationOverview() {
  const { activeOrgId, activeOrg } = useAuth();
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<OrgDetails | null>(null);

  const editable = canManageOrg(activeOrg?.role);

  const load = useCallback(async () => {
    if (!activeOrgId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/organisations/${activeOrgId}`,
        withOrgHeaders(activeOrgId)
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load organisation");
      setDetails(data.organisation as OrgDetails);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-12 mb-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
      </div>
    );
  }

  const logoSrc = resolveMediaUrl(details?.logoUrl || activeOrg?.logoUrl);
  const name = details?.name || activeOrg?.name || "Workspace";
  const initials = name.slice(0, 1).toUpperCase();
  const addressText = formatAddress(details?.address);

  return (
    <div className="bg-white dark:bg-zinc-950/60 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 mb-8 shadow-sm">
      <div className="flex items-start gap-4 sm:gap-5">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#2563eb] text-white flex items-center justify-center font-bold text-xl uppercase overflow-hidden shrink-0">
          {logoSrc ? (
            <img src={logoSrc} alt="" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-50 flex items-center gap-2 truncate">
                <Building2 className="w-4 h-4 text-[#2563eb] shrink-0" />
                <span className="truncate">{name}</span>
              </h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                {activeOrg?.role || "Member"}
                {typeof details?.memberCount === "number"
                  ? ` · ${details.memberCount} member${details.memberCount === 1 ? "" : "s"}`
                  : null}
              </p>
            </div>
            {editable && (
              <Link
                href="/manage/organisation/edit"
                className="inline-flex items-center gap-1.5 shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </Link>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailRow label="Website" value={details?.website} />
            <DetailRow label="GST number" value={details?.gstNumber} />
            <div className="sm:col-span-2">
              <DetailRow label="Address" value={addressText} />
            </div>
          </div>

          {!editable && (
            <p className="mt-4 text-xs text-amber-800 dark:text-amber-200/90 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-lg px-3 py-2">
              Only owners and admins can edit organisation details.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
