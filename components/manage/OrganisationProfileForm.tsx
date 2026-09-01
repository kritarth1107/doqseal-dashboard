"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Building2, Camera, Loader2 } from "lucide-react";
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
  const { activeOrgId, activeOrg } = useAuth();
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
      void load();
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
      </div>
    );
  }

  const logoSrc = resolveMediaUrl(logoUrl);
  const initials = (details?.name || activeOrg?.name || "O").slice(0, 1).toUpperCase();

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start gap-6">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-[#2563eb] text-white flex items-center justify-center font-bold text-2xl uppercase overflow-hidden">
            {logoSrc ? (
              <img src={logoSrc} alt="" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          {editable && (
            <>
              <button
                type="button"
                disabled={uploadingLogo}
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center text-gray-600 hover:text-[#2563eb] disabled:opacity-50"
                title="Upload logo"
              >
                {uploadingLogo ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
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
            </>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#2563eb]" />
                {details?.name || activeOrg?.name || "Workspace"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Role: <span className="font-medium text-gray-700">{activeOrg?.role || "Member"}</span>
              </p>
            </div>
          </div>

          {!editable && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Only organisation owners and admins can edit workspace details.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-gray-700">Organisation name</span>
              <input
                value={name}
                disabled={!editable}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 disabled:bg-gray-50"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-gray-700">Website</span>
              <input
                value={website}
                disabled={!editable}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                className="rounded-lg border border-gray-200 px-3 py-2 disabled:bg-gray-50"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
              <span className="font-medium text-gray-700">GST number</span>
              <input
                value={gstNumber}
                disabled={!editable}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
                className="rounded-lg border border-gray-200 px-3 py-2 font-mono uppercase disabled:bg-gray-50"
              />
            </label>
          </div>

          <div className="pt-2">
            <p className="text-sm font-medium text-gray-700 mb-3">Business address</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
                <span className="text-gray-600">Address line 1</span>
                <input
                  value={address.line1 || ""}
                  disabled={!editable}
                  onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
                  className="rounded-lg border border-gray-200 px-3 py-2 disabled:bg-gray-50"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
                <span className="text-gray-600">Address line 2</span>
                <input
                  value={address.line2 || ""}
                  disabled={!editable}
                  onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))}
                  className="rounded-lg border border-gray-200 px-3 py-2 disabled:bg-gray-50"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-gray-600">City</span>
                <input
                  value={address.city || ""}
                  disabled={!editable}
                  onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                  className="rounded-lg border border-gray-200 px-3 py-2 disabled:bg-gray-50"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-gray-600">State</span>
                <input
                  value={address.state || ""}
                  disabled={!editable}
                  onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
                  className="rounded-lg border border-gray-200 px-3 py-2 disabled:bg-gray-50"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-gray-600">Postal code</span>
                <input
                  value={address.postalCode || ""}
                  disabled={!editable}
                  onChange={(e) => setAddress((a) => ({ ...a, postalCode: e.target.value }))}
                  className="rounded-lg border border-gray-200 px-3 py-2 disabled:bg-gray-50"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-gray-600">Country</span>
                <input
                  value={address.country || "IN"}
                  disabled={!editable}
                  onChange={(e) => setAddress((a) => ({ ...a, country: e.target.value }))}
                  className="rounded-lg border border-gray-200 px-3 py-2 disabled:bg-gray-50"
                />
              </label>
            </div>
          </div>

          {editable && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveProfile()}
                className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-[#1d4ed8] disabled:opacity-50 inline-flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save details
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
