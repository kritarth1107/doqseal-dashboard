import type { BundleDetail, BundleDocumentView } from "../types";

export function doc(overrides: Partial<BundleDocumentView> = {}): BundleDocumentView {
  return {
    documentId: "d1",
    typeKey: null,
    filename: "file.pdf",
    mimeType: "application/pdf",
    size: 100,
    extractionStatus: "completed",
    available: true,
    restricted: false,
    classification: null,
    ...overrides,
  };
}

export function bundle(overrides: Partial<BundleDetail> = {}): BundleDetail {
  return {
    bundleId: "b1",
    templateId: "t1",
    templateVersion: 1,
    name: "Priya Sharma",
    externalRef: "APP-1",
    status: "collecting",
    reviewed: false,
    template: {
      templateId: "t1",
      version: 1,
      name: "Retail loan",
      documentTypes: [
        { key: "pan_card", label: "PAN card", required: true, conditional: false, minCount: 1, maxCount: 1 },
        { key: "bank_statement", label: "Bank statement", required: true, conditional: false, minCount: 1, maxCount: 0 },
        { key: "form16", label: "Form 16", required: false, conditional: true, minCount: 0, maxCount: 0 },
      ],
      profileFields: [],
    },
    pipeline: null,
    review: null,
    documents: [],
    ...overrides,
  };
}
