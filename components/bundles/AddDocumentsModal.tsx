"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, FolderOpen, Loader2, Search, UploadCloud, X } from "lucide-react";
import { UploadModal } from "@/components/UploadModal";
import { withOrgHeaders } from "@/lib/client-api";
import type { UploadResult } from "@/lib/upload-document";
import type { BundleDetail } from "@/lib/bundles/types";
import { INPUT_CLASS, PRIMARY_BUTTON, SECONDARY_BUTTON } from "./ui";

type DriveDocument = {
  documentId: string;
  originalFilename: string;
  displayTitle?: string | null;
  status?: string;
  updatedAt?: string;
};

/**
 * Adds documents to a case pack: upload new files through the standard upload
 * flow, or pick files already in Drive. An optional slot places them directly;
 * otherwise they are sorted automatically (or wait for a person).
 * Mount it fresh for each use (render it conditionally) so the form resets.
 */
export function AddDocumentsModal({
  open,
  onClose,
  bundle,
  organisationId,
  initialSlot,
  onAttach,
}: {
  open: boolean;
  onClose: () => void;
  bundle: BundleDetail;
  organisationId: string | null;
  initialSlot: string | null;
  onAttach: (documentIds: string[], typeKey: string | null) => Promise<boolean>;
}) {
  const [mode, setMode] = useState<"choose" | "drive">("choose");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [slot, setSlot] = useState<string>(initialSlot ?? "");
  const [docs, setDocs] = useState<DriveDocument[] | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || mode !== "drive" || docs !== null) return;
    let cancelled = false;
    fetch("/api/documents", withOrgHeaders(organisationId))
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) throw new Error(data?.error || "Could not load your documents.");
        setDocs(Array.isArray(data.documents) ? data.documents : []);
      })
      .catch((err) => !cancelled && setDriveError(err instanceof Error ? err.message : "Could not load your documents."));
    return () => {
      cancelled = true;
    };
  }, [open, mode, docs, organisationId]);

  const inPack = useMemo(() => new Set(bundle.documents.map((d) => d.documentId)), [bundle.documents]);
  const filtered = (docs ?? []).filter((d) => {
    if (inPack.has(d.documentId)) return false;
    const title = (d.displayTitle || d.originalFilename || "").toLowerCase();
    return !query.trim() || title.includes(query.trim().toLowerCase());
  });

  const attach = async (ids: string[]) => {
    if (!ids.length) return;
    setSaving(true);
    setError(null);
    const ok = await onAttach(ids, slot || null);
    setSaving(false);
    if (ok) onClose();
    else setError("Could not add the documents. Try again.");
  };

  const onUploaded = (results: UploadResult[]) => {
    void onAttach(
      results.map((r) => r.documentId),
      slot || null
    );
  };

  if (uploadOpen) {
    return (
      <UploadModal
        isOpen
        onClose={() => {
          setUploadOpen(false);
          onClose();
        }}
        organisationId={organisationId}
        projectId={bundle.projectId || undefined}
        defaultSharedWithOrganisation
        onSuccess={onUploaded}
      />
    );
  }
  if (!open) return null;

  const slots = bundle.template?.documentTypes ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="add-docs-title">
      <div className="bg-white dark:bg-[#111827] w-full max-w-xl rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
          <h2 id="add-docs-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Add documents
          </h2>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4 overflow-y-auto">
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Slot</span>
            <select className={INPUT_CLASS} value={slot} onChange={(e) => setSlot(e.target.value)}>
              <option value="">Sort automatically</option>
              {slots.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            <span className="block text-xs text-slate-400 mt-1">
              Leave on “Sort automatically” if the files are mixed. Anything that cannot be placed will ask for a slot.
            </span>
          </label>

          {mode === "choose" ? (
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUploadOpen(true)}
                className="rounded-xl border border-gray-200 dark:border-zinc-800 p-4 text-left hover:border-[#2563eb] transition-colors"
              >
                <UploadCloud className="w-5 h-5 text-[#2563eb] mb-2" />
                <p className="font-medium text-slate-900 dark:text-slate-100">Upload files</p>
                <p className="text-xs text-slate-500 mt-0.5">PDFs and images from your computer.</p>
              </button>
              <button
                type="button"
                onClick={() => setMode("drive")}
                className="rounded-xl border border-gray-200 dark:border-zinc-800 p-4 text-left hover:border-[#2563eb] transition-colors"
              >
                <FolderOpen className="w-5 h-5 text-[#2563eb] mb-2" />
                <p className="font-medium text-slate-900 dark:text-slate-100">Choose from Drive</p>
                <p className="text-xs text-slate-500 mt-0.5">Documents already uploaded to DoqSeal.</p>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="search"
                  aria-label="Search documents"
                  className={`${INPUT_CLASS} pl-10`}
                  placeholder="Search documents…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              {driveError ? (
                <p className="text-sm text-red-600" role="alert">{driveError}</p>
              ) : docs === null ? (
                <div className="flex items-center gap-2 text-sm text-slate-500 py-6 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading documents…
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">
                  {docs.length === 0 ? "Drive is empty. Upload files instead." : "No other documents match."}
                </p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-zinc-800 border border-gray-100 dark:border-zinc-800 rounded-xl max-h-72 overflow-y-auto">
                  {filtered.map((d) => {
                    const checked = selected.includes(d.documentId);
                    return (
                      <li key={d.documentId}>
                        <label className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/40">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-[#2563eb] focus:ring-[#2563eb]"
                            checked={checked}
                            onChange={() =>
                              setSelected((s) => (checked ? s.filter((x) => x !== d.documentId) : [...s, d.documentId]))
                            }
                          />
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-sm text-slate-800 dark:text-slate-100 truncate">
                            {d.displayTitle || d.originalFilename}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        </div>

        {mode === "drive" && (
          <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-gray-100 dark:border-zinc-800">
            <button type="button" className={SECONDARY_BUTTON} onClick={() => setMode("choose")} disabled={saving}>
              Back
            </button>
            <button
              type="button"
              className={PRIMARY_BUTTON}
              disabled={!selected.length || saving}
              onClick={() => void attach(selected)}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Add {selected.length || ""} document{selected.length === 1 ? "" : "s"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
