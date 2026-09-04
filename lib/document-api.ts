import { DocumentStatus, StoredDocument } from "@/types/extraction";

type BackendDocumentPayload = {
  document: {
    documentId: string;
    projectId: string | null;
    projectName?: string | null;
    organisationId?: string | null;
    originalFilename: string;
    displayTitle?: string | null;
    mimeType: string;
    size: number;
    status: string;
    contentHash?: string;
    filePurgedAt?: string | null;
    retentionDays?: number | null;
    keepForever?: boolean;
    fileExpiresAt?: string | null;
    uploadedBy?: string;
    uploadedByUser?: {
      userId: string;
      name: string;
      email?: string | null;
      avatar?: string | null;
    } | null;
    sharedWithOrganisation?: boolean;
    createdAt: string;
    updatedAt: string;
  };
  job?: {
    jobId: string;
    status: string;
    error?: string | null;
    completedAt?: string | null;
    demoMode?: boolean;
    demoRevealAt?: string | null;
  } | null;
  extraction?: {
    extractionId: string;
    jobId: string;
    data: Record<string, unknown>;
    fieldConfidence: Record<string, number>;
    validationErrors: string[];
    status: string;
    strategy?: string;
    version: number;
    approvedAt?: string | null;
  } | null;
};

function mapStatus(status: string): DocumentStatus {
  if (status === "completed") return "completed";
  if (status === "failed") return "failed";
  if (status === "needs_review") return "needs_review";
  return "processing";
}

function averageConfidence(values: Record<string, number>): number {
  const scores = Object.values(values);
  if (!scores.length) return 0;
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

export function mapBackendDocument(
  payload: BackendDocumentPayload
): StoredDocument {
  const { document, extraction, job } = payload;
  const fieldConfidence = extraction?.fieldConfidence ?? {};

  return {
    id: document.documentId,
    projectId: document.projectId ?? null,
    projectName: document.projectName ?? null,
    organisationId: document.organisationId ?? null,
    jobId: job?.jobId,
    originalFilename: document.originalFilename,
    displayTitle: document.displayTitle || null,
    storedFilename: document.documentId,
    mimeType: document.mimeType,
    size: document.size,
    status: mapStatus(document.status),
    extractedJson: (extraction?.data as StoredDocument["extractedJson"]) ?? null,
    fieldConfidence,
    confidence: averageConfidence(fieldConfidence),
    extractionStrategy: extraction?.strategy || (extraction ? "hybrid" : "pending"),
    extractionStatus: extraction?.status ?? null,
    uploadedAt: document.createdAt,
    processedAt: extraction?.approvedAt ?? job?.completedAt ?? undefined,
    processingError: job?.error ?? undefined,
    filePurgedAt: document.filePurgedAt || null,
    retentionDays: document.retentionDays ?? null,
    keepForever: Boolean(document.keepForever),
    fileExpiresAt: document.fileExpiresAt || null,
    uploadedBy: document.uploadedBy,
    uploadedByUser: document.uploadedByUser ?? null,
    contentHash: document.contentHash,
    sharedWithOrganisation: document.sharedWithOrganisation !== false,
    demoMode: Boolean(job?.demoMode),
    demoRevealAt: job?.demoRevealAt ?? null,
  };
}

export function mapBackendDocumentList(
  documents: Array<{
    documentId: string;
    projectId: string | null;
    originalFilename: string;
    displayTitle?: string | null;
    mimeType: string;
    size: number;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>
): StoredDocument[] {
  return documents.map((document) => ({
    id: document.documentId,
    projectId: document.projectId ?? null,
    originalFilename: document.originalFilename,
    displayTitle: document.displayTitle || null,
    storedFilename: document.documentId,
    mimeType: document.mimeType,
    size: document.size,
    status: mapStatus(document.status),
    extractedJson: null,
    fieldConfidence: {},
    confidence: 0,
    extractionStrategy: "pending",
    uploadedAt: document.createdAt,
  }));
}

/** Preview of the webhook body sent on document.processed */
export function buildWebhookPayloadPreview(doc: StoredDocument) {
  return {
    event: "document.processed",
    organisationId: doc.organisationId ?? null,
    project: doc.projectId
      ? {
          id: doc.projectId,
          name: doc.projectName || null,
        }
      : null,
    document: {
      id: doc.id,
      originalFilename: doc.originalFilename,
      displayTitle: doc.displayTitle || null,
      mimeType: doc.mimeType,
      size: doc.size,
      status: doc.status,
      contentHash: doc.contentHash || null,
    },
    jobId: doc.jobId || null,
    uploadedBy: doc.uploadedByUser
      ? {
          userId: doc.uploadedByUser.userId,
          name: doc.uploadedByUser.name,
          email: doc.uploadedByUser.email || null,
        }
      : doc.uploadedBy
        ? { userId: doc.uploadedBy, name: null, email: null }
        : null,
    uploadedVia: "dashboard",
    uploadedAt: doc.uploadedAt,
    processedAt: doc.processedAt || null,
    extraction: doc.extractedJson
      ? {
          data: doc.extractedJson,
          fieldConfidence: doc.fieldConfidence || {},
          strategy: doc.extractionStrategy || null,
          status: doc.extractionStatus || doc.status,
        }
      : null,
    timestamp: new Date().toISOString(),
  };
}
