import axios from "axios";

export type UploadResult = {
  documentId: string;
  jobId?: string;
  status?: string;
  filename: string;
  projectId: string | null;
  sharedWithOrganisation?: boolean;
};

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
]);

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export function validateUploadFile(file: File): string | null {
  if (file.size > MAX_UPLOAD_BYTES) {
    return `${file.name} is too large (max 20MB)`;
  }
  const mime = file.type || "";
  const ext = file.name.split(".").pop()?.toLowerCase();
  const okByMime = ALLOWED_MIME.has(mime);
  const okByExt = ["pdf", "png", "jpg", "jpeg"].includes(ext || "");
  if (!okByMime && !okByExt) {
    return `${file.name}: only PDF, PNG, or JPG are supported`;
  }
  return null;
}

/**
 * Upload a file to Drive (optional project) via BFF.
 * Progress reflects browser → dashboard.
 */
export async function uploadDocument(opts: {
  organisationId: string;
  file: File;
  projectId?: string | null;
  sharedWithOrganisation?: boolean;
  onProgress?: (percent: number) => void;
}): Promise<UploadResult> {
  const {
    organisationId,
    file,
    projectId,
    sharedWithOrganisation = false,
    onProgress,
  } = opts;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("consent", "true");
  formData.append(
    "sharedWithOrganisation",
    sharedWithOrganisation ? "true" : "false"
  );
  if (projectId) {
    formData.append("projectId", projectId);
  }

  const url = projectId
    ? `/api/projects/${projectId}/upload`
    : `/api/documents/upload`;

  try {
    const res = await axios.post(url, formData, {
      headers: {
        "x-organisation-id": organisationId,
      },
      onUploadProgress: (event) => {
        if (!onProgress) return;
        if (event.total && event.total > 0) {
          onProgress(Math.min(99, Math.round((event.loaded * 100) / event.total)));
        } else if (event.loaded) {
          onProgress(Math.min(90, Math.round(event.loaded / (1024 * 50))));
        }
      },
    });

    onProgress?.(100);

    return {
      documentId: res.data.documentId,
      jobId: res.data.jobId,
      status: res.data.status,
      filename: file.name,
      projectId: res.data.projectId ?? projectId ?? null,
      sharedWithOrganisation: res.data.sharedWithOrganisation,
    };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const message =
        (error.response?.data as { error?: string } | undefined)?.error ||
        error.message ||
        "Upload failed";
      throw new Error(message);
    }
    throw error;
  }
}

/** @deprecated Prefer uploadDocument */
export async function uploadDocumentToProject(opts: {
  projectId: string;
  organisationId: string;
  file: File;
  onProgress?: (percent: number) => void;
  sharedWithOrganisation?: boolean;
}): Promise<UploadResult> {
  return uploadDocument({
    organisationId: opts.organisationId,
    file: opts.file,
    projectId: opts.projectId,
    sharedWithOrganisation: opts.sharedWithOrganisation ?? true,
    onProgress: opts.onProgress,
  });
}
