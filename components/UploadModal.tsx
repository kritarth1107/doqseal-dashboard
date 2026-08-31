"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  UploadCloud,
  File,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  uploadDocument,
  validateUploadFile,
  type UploadResult,
} from "@/lib/upload-document";

export type UploadProjectOption = {
  projectId: string;
  name: string;
};

type FileProgress = {
  name: string;
  size: number;
  percent: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  organisationId: string | null;
  /** When set, skip project picker (project detail / intelligence). */
  projectId?: string;
  /** Optional projects for Drive picker — empty selection = common Drive */
  projects?: UploadProjectOption[];
  /** Default for share checkbox. Drive: false. Project upload: true. */
  defaultSharedWithOrganisation?: boolean;
  onSuccess?: (results: UploadResult[]) => void;
}

export function UploadModal({
  isOpen,
  onClose,
  organisationId,
  projectId: fixedProjectId,
  projects = [],
  defaultSharedWithOrganisation,
  onSuccess,
}: UploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [agreedToDPA, setAgreedToDPA] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [shareWithOrg, setShareWithOrg] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileProgress, setFileProgress] = useState<FileProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const needsProjectPicker = !fixedProjectId;
  const effectiveProjectId = fixedProjectId || selectedProjectId || null;

  useEffect(() => {
    if (!isOpen) return;
    setSelectedFiles([]);
    setAgreedToDPA(false);
    setUploading(false);
    setFileProgress([]);
    if (fixedProjectId) {
      setSelectedProjectId(fixedProjectId);
      setShareWithOrg(defaultSharedWithOrganisation ?? true);
    } else {
      setSelectedProjectId("");
      setShareWithOrg(defaultSharedWithOrganisation ?? false);
    }
  }, [isOpen, fixedProjectId, defaultSharedWithOrganisation]);

  // When picking a project from Drive, default share to true; common Drive stays false unless user checked
  useEffect(() => {
    if (fixedProjectId || !needsProjectPicker) return;
    if (selectedProjectId) {
      setShareWithOrg(true);
    } else if (defaultSharedWithOrganisation === undefined) {
      setShareWithOrg(false);
    }
  }, [selectedProjectId, fixedProjectId, needsProjectPicker, defaultSharedWithOrganisation]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const addFiles = (incoming: File[]) => {
    const valid: File[] = [];
    const errors: string[] = [];
    for (const file of incoming) {
      const err = validateUploadFile(file);
      if (err) errors.push(err);
      else valid.push(file);
    }
    if (errors.length) {
      setFileProgress((prev) => [
        ...prev,
        ...errors.map((error) => ({
          name: error.split(":")[0] || "File",
          size: 0,
          percent: 0,
          status: "error" as const,
          error,
        })),
      ]);
    }
    if (valid.length) {
      setSelectedFiles((prev) => [...prev, ...valid]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) addFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const removeFile = (indexToRemove: number) => {
    if (uploading) return;
    setSelectedFiles((files) => files.filter((_, idx) => idx !== indexToRemove));
  };

  const handleClose = () => {
    if (uploading) return;
    onClose();
  };

  const handleUploadClick = async () => {
    if (
      !agreedToDPA ||
      selectedFiles.length === 0 ||
      !organisationId ||
      uploading
    ) {
      return;
    }

    setUploading(true);
    setFileProgress(
      selectedFiles.map((f) => ({
        name: f.name,
        size: f.size,
        percent: 0,
        status: "pending",
      }))
    );

    const results: UploadResult[] = [];
    let hadError = false;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setFileProgress((prev) =>
        prev.map((p, idx) =>
          idx === i ? { ...p, status: "uploading", percent: 0 } : p
        )
      );

      try {
        const result = await uploadDocument({
          organisationId,
          file,
          projectId: effectiveProjectId,
          sharedWithOrganisation: shareWithOrg,
          onProgress: (percent) => {
            setFileProgress((prev) =>
              prev.map((p, idx) => (idx === i ? { ...p, percent } : p))
            );
          },
        });
        results.push(result);
        setFileProgress((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, status: "done", percent: 100 } : p
          )
        );
      } catch (error: unknown) {
        hadError = true;
        const message =
          error instanceof Error ? error.message : "Upload failed";
        setFileProgress((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, status: "error", error: message } : p
          )
        );
      }
    }

    setUploading(false);

    if (results.length > 0) {
      onSuccess?.(results);
      if (!hadError) {
        setTimeout(() => {
          setSelectedFiles([]);
          setAgreedToDPA(false);
          setFileProgress([]);
          onClose();
        }, 600);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  if (!isOpen) return null;

  const canUpload =
    agreedToDPA &&
    selectedFiles.length > 0 &&
    Boolean(organisationId) &&
    !uploading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-[#333]">Upload Documents</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
          {needsProjectPicker && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                Destination
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                disabled={uploading}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
              >
                <option value="">Organisation Drive (no project)</option>
                {projects.map((p) => (
                  <option key={p.projectId} value={p.projectId}>
                    Project: {p.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                {selectedProjectId
                  ? "File will be attached to the selected project."
                  : "File is stored in Drive without a project — fine for one-off uploads."}
              </p>
            </div>
          )}

          <div
            onDragOver={uploading ? undefined : handleDragOver}
            onDragLeave={uploading ? undefined : handleDragLeave}
            onDrop={uploading ? undefined : handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all duration-200 ease-in-out ${
              uploading
                ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                : isDragging
                  ? "border-[#2563eb] bg-[#2563eb]/5 cursor-pointer"
                  : "border-gray-300 hover:bg-gray-50 cursor-pointer"
            }`}
          >
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx,.csv,.txt,application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain"
              disabled={uploading}
            />
            <div
              className={`p-4 rounded-full mb-4 ${
                isDragging
                  ? "bg-[#2563eb]/20 text-[#2563eb]"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              <UploadCloud className="w-8 h-8" />
            </div>
            <p className="text-[#333] font-medium mb-1 text-center">
              Click to upload{" "}
              <span className="text-gray-500 font-normal">or drag and drop</span>
            </p>
            <p className="text-xs text-gray-500 text-center">
              PDF, PNG, or JPG (max. 20MB each)
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-gray-700">
                Selected Files ({selectedFiles.length})
              </h3>
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                {selectedFiles.map((file, index) => {
                  const progress = fileProgress[index];
                  return (
                    <div
                      key={`${file.name}-${index}`}
                      className="p-3 bg-gray-50 border border-gray-200 rounded-xl"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 overflow-hidden min-w-0">
                          <div className="p-2 bg-blue-50 text-blue-500 rounded-lg shrink-0">
                            {progress?.status === "uploading" ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : progress?.status === "done" ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : progress?.status === "error" ? (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            ) : (
                              <File className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex flex-col truncate min-w-0">
                            <span className="text-sm font-medium text-[#333] truncate">
                              {file.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                              {progress?.status === "uploading" &&
                                ` • ${progress.percent}%`}
                              {progress?.status === "done" && " • Uploaded"}
                              {progress?.status === "error" &&
                                progress.error &&
                                ` • ${progress.error}`}
                            </span>
                          </div>
                        </div>
                        {!uploading && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(index);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors shrink-0"
                            title="Remove file"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {(progress?.status === "uploading" ||
                        progress?.status === "done") && (
                        <div className="mt-2.5 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-200 ${
                              progress.status === "done"
                                ? "bg-emerald-500"
                                : "bg-[#2563eb]"
                            }`}
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
            <input
              type="checkbox"
              checked={shareWithOrg}
              disabled={uploading}
              onChange={(e) => setShareWithOrg(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[#2563eb]"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-[#333]">
                Share with organisation
              </span>
              <span className="text-xs text-gray-500 leading-relaxed">
                {shareWithOrg
                  ? "Other members can see this file and use it in AI context."
                  : "Only you can see this file. Other org members won’t get it in Drive or AI context."}
              </span>
            </span>
          </label>

          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center h-5 mt-0.5">
              <input
                id="dpa-agreement"
                type="checkbox"
                checked={agreedToDPA}
                disabled={uploading}
                onChange={(e) => setAgreedToDPA(e.target.checked)}
                className="w-4 h-4 text-black bg-white border-gray-300 rounded focus:ring-black cursor-pointer accent-black"
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="dpa-agreement"
                className="text-sm font-medium text-[#333] cursor-pointer"
              >
                Data Processing Agreement
              </label>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                By uploading these documents, you agree to our terms of service
                and explicitly consent to automated data processing to extract,
                index, and organize the contents according to our DPA.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={!canUpload}
            className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-[#2563eb] hover:bg-[#1d4ed8] transition-colors rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[9rem]"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                {agreedToDPA && selectedFiles.length > 0 && (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                Upload
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
