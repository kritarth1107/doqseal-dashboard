"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
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
};

function canManageOrg(role?: string) {
  return role === "owner" || role === "admin";
}

export function OrganisationProfileForm() {
  const router = useRouter();
  const { activeOrgId, activeOrg, refreshUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [details, setDetails] = useState<OrgDetails | null>(null);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [address, setAddress] = useState<OrgAddress>({
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "IN",
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

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
      const org = data.organisation as OrgDetails;
      setDetails(org);
      setName(org.name || "");
      setWebsite(org.website || "");
      setGstNumber(org.gstNumber || "");
      setAddress({
        line1: org.address?.line1 || "",
        line2: org.address?.line2 || "",
        city: org.address?.city || "",
        state: org.address?.state || "",
        postalCode: org.address?.postalCode || "",
        country: org.address?.country || "IN",
      });
      setLogoUrl(org.logoUrl || null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveProfile = async () => {
    if (!activeOrgId || !editable) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/organisations/${activeOrgId}/profile`,
        withOrgHeaders(activeOrgId, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            website: website || null,
            gstNumber: gstNumber || null,
            address,
          }),
        })
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast.success("Organisation details saved");
      await refreshUser();
      router.push("/manage/organisation");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file: File) => {
    if (!activeOrgId || !editable) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(
        `/api/organisations/${activeOrgId}/logo`,
        withOrgHeaders(activeOrgId, { method: "POST", body: formData })
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setLogoUrl(data.logoUrl || null);
      toast.success("Logo updated");
      await refreshUser();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
      </div>
    );
  }

  if (!editable) {
    return (
      <div className="max-w-xl mx-auto">
        <Link
          href="/manage/organisation"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Only organisation owners and admins can edit workspace details.
        </p>
      </div>
    );
  }

  const logoSrc = resolveMediaUrl(logoUrl);
  const initials = (details?.name || activeOrg?.name || "O").slice(0, 1).toUpperCase();

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link
          href="/manage/organisation"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Edit organisation
        </h1>
      </div>

      <div className="bg-white dark:bg-zinc-950/60 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-5">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-xl bg-[#2563eb] text-white flex items-center justify-center font-bold text-xl uppercase overflow-hidden">
              {logoSrc ? (
                <img src={logoSrc} alt="" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <button
              type="button"
              disabled={uploadingLogo}
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow flex items-center justify-center text-gray-600 dark:text-zinc-300 hover:text-[#2563eb] disabled:opacity-50"
              title="Upload logo"
            >
              {uploadingLogo ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadLogo(file);
                e.target.value = "";
              }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {name || "Organisation"}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Square image, JPG/PNG/WebP
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Website</span>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">GST number</span>
            <input
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
              placeholder="22AAAAA0000A1Z5"
              maxLength={15}
              className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm font-mono uppercase"
            />
          </label>
        </div>

        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Address
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="text-zinc-500 text-xs">Line 1</span>
              <input
                value={address.line1 || ""}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, line1: e.target.value }))
                }
                className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="text-zinc-500 text-xs">Line 2</span>
              <input
                value={address.line2 || ""}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, line2: e.target.value }))
                }
                className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-500 text-xs">City</span>
              <input
                value={address.city || ""}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, city: e.target.value }))
                }
                className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-500 text-xs">State</span>
              <input
                value={address.state || ""}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, state: e.target.value }))
                }
                className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-500 text-xs">Postal code</span>
              <input
                value={address.postalCode || ""}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, postalCode: e.target.value }))
                }
                className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-500 text-xs">Country</span>
              <input
                value={address.country || "IN"}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, country: e.target.value }))
                }
                className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Link
            href="/manage/organisation"
            className="px-3.5 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
          >
            Cancel
          </Link>
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveProfile()}
            className="px-3.5 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-[#1d4ed8] disabled:opacity-50 inline-flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
