"use client";

import { useRef, useState, useEffect } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { resolveMediaUrl } from "@/lib/media-url";

export function ProfileSettings() {
  const { userData, refreshUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(userData?.name || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(userData?.avatar || null);

  useEffect(() => {
    setName(userData?.name || "");
    setAvatarUrl(userData?.avatar || null);
  }, [userData?.name, userData?.avatar]);

  const displayName = name || userData?.name || "";
  const initials =
    displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2) || "??";
  const avatarSrc = resolveMediaUrl(avatarUrl || userData?.avatar);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast.success("Profile updated");
      await refreshUser();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setAvatarUrl(data.avatar || null);
      toast.success("Profile photo updated");
      await refreshUser();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-base font-semibold text-black dark:text-slate-100 border-b border-gray-200 dark:border-zinc-800 pb-2">
        Profile
      </h2>

      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-full bg-[#e3d5c8] text-[#5c4a3d] flex items-center justify-center font-semibold overflow-hidden">
            {avatarSrc ? (
              <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow flex items-center justify-center text-gray-500 hover:text-[#2563eb] disabled:opacity-50"
            title="Change photo"
          >
            {uploading ? (
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
              if (file) void uploadAvatar(file);
              e.target.value = "";
            }}
          />
        </div>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          JPEG, PNG, WebP or GIF · max 2 MB
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Full name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Email address
          </span>
          <input
            type="text"
            disabled
            value={userData?.email || ""}
            className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm disabled:opacity-70"
          />
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={() => void saveProfile()}
          className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-[#1d4ed8] disabled:opacity-50 inline-flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save profile
        </button>
      </div>
    </section>
  );
}
