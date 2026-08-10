import { DocumentStatus, StoredDocument } from "@/types/extraction";

type BackendDocumentPayload = {
  document: {
    documentId: string;
    projectId: string;
    originalFilename: string;
    mimeType: string;
    size: number;
    status: string;
    contentHash?: string;
    createdAt: string;
    updatedAt: string;
  };
  job?: {
    jobId: string;
    status: string;
    error?: string | null;
    completedAt?: string | null;
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
    projectId: document.projectId,
    jobId: job?.jobId,
    originalFilename: document.originalFilename,
    storedFilename: document.documentId,
    mimeType: document.mimeType,
    size: document.size,
    status: mapStatus(document.status),
    extractedJson: (extraction?.data as StoredDocument["extractedJson"]) ?? null,
    fieldConfidence,
    confidence: averageConfidence(fieldConfidence),
      extractionStrategy: extraction?.strategy || (extraction ? "hybrid" : "pending"),
    uploadedAt: document.createdAt,
    processedAt: extraction?.approvedAt ?? undefined,
    processingError: job?.error ?? undefined,
  };
}

export function mapBackendDocumentList(
  documents: Array<{
    documentId: string;
    projectId: string;
    originalFilename: string;
    mimeType: string;
    size: number;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>
): StoredDocument[] {
  return documents.map((document) => ({
    id: document.documentId,
    projectId: document.projectId,
    originalFilename: document.originalFilename,
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