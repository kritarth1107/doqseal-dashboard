/** Shapes returned by the backend bundle API (see backend docs/bundle-intelligence/REVIEW.md). */

export type BundleStatus =
  | "collecting"
  | "ready_to_run"
  | "running"
  | "exceptions_found"
  | "needs_review"
  | "ready"
  | "failed"
  | "archived";

export type ClassificationStatus =
  | "pending"
  | "queued"
  | "classifying"
  | "classified"
  | "needs_review"
  | "failed";

export interface BundleProgress {
  requiredSlots: number;
  requiredSlotsMet: number;
  missing: number;
  openConflicts: number;
  needsAttention: number;
  inProgress: number;
  evaluatedAt?: string | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BundleListItem {
  bundleId: string;
  projectId?: string | null;
  templateId: string;
  templateVersion: number;
  externalRef?: string | null;
  name?: string | null;
  status: BundleStatus;
  runCount?: number;
  assignees?: string[];
  createdAt?: string;
  updatedAt?: string;
  documentCount?: number;
  templateName?: string | null;
  progress?: BundleProgress | null;
  reviewed?: boolean;
}

export interface SlotDefinition {
  key: string;
  label: string;
  required: boolean;
  conditional: boolean;
  minCount: number;
  maxCount: number;
}

export interface ChecklistItem {
  typeKey: string;
  label: string;
  required: boolean;
  received: number;
  minCount: number;
  maxCount: number;
  status: string;
}

export interface ConflictValue {
  documentId: string;
  typeKey: string | null;
  value: string;
}

export type ConflictReviewStatus = "open" | "resolved" | "dismissed";

export interface ConflictResolution {
  action: "resolve" | "dismiss";
  actorId: string;
  at: string;
  value?: string | null;
  reason?: string | null;
}

export interface BundleConflict {
  field: string;
  message: string;
  severity: "review";
  values: ConflictValue[];
  key?: string;
  valuesHash?: string;
  status?: ConflictReviewStatus;
  resolution?: ConflictResolution | null;
}

export interface PipelineSummary {
  evaluatedAt: string;
  documents: {
    total: number;
    inProgress: number;
    classified: number;
    needsReview: number;
    failed: number;
    unassigned: number;
  };
  checklist: ChecklistItem[];
  missing: Array<{ typeKey: string; label: string; required: number; received: number }>;
  conflicts: BundleConflict[];
}

export interface DocumentClassification {
  status: ClassificationStatus;
  suggestedTypeKey: string | null;
  confidence: number | null;
  alternatives: Array<{ slot: string; confidence: number }>;
  reasons: string[];
  lastError: string | null;
}

export interface BundleDocumentView {
  documentId: string;
  typeKey: string | null;
  classificationConfidence?: number | null;
  assignedBy?: "auto" | "user";
  addedAt?: string;
  filename: string | null;
  mimeType: string | null;
  size: number | null;
  extractionStatus: string | null;
  available: boolean;
  restricted: boolean;
  classification: DocumentClassification | null;
}

export interface BundleReview {
  reviewedAt: string;
  note: string | null;
  reviewer: { userId: string; name: string } | null;
}

export interface BundleDetail extends BundleListItem {
  organisationId?: string;
  profile?: Record<string, unknown>;
  readOnly?: boolean;
  lastRunId?: string | null;
  template: {
    templateId: string;
    version: number;
    name: string | null;
    documentTypes: SlotDefinition[];
    profileFields: Array<{
      key: string;
      label: string;
      type: string;
      options: string[];
      required: boolean;
    }>;
  };
  pipeline: PipelineSummary | null;
  review: BundleReview | null;
  documents: BundleDocumentView[];
}

export interface TimelineEntry {
  id: string;
  action: string;
  timestamp: string;
  actor: { userId: string | null; name: string; isSystem: boolean };
  details: Record<string, unknown>;
}

export interface StarterTemplate {
  key: string;
  vertical: string;
  verticalLabel: string;
  name: string;
  description: string;
  documentTypes: Array<{
    key: string;
    label: string;
    required: boolean;
    conditional: boolean;
    minCount: number;
  }>;
  profileFieldCount: number;
  ruleCount: number;
  templateId: string | null;
  templateStatus: string | null;
}

export interface TemplateListItem {
  templateId: string;
  name: string;
  description?: string;
  status: "draft" | "published" | "archived";
  latestVersion: number;
  isExample?: boolean;
  documentTypeCount?: number;
}

export interface TemplateDetail extends TemplateListItem {
  draft?: {
    documentTypes?: Array<{ key: string; label: string; required?: boolean | string; minCount?: number }>;
    profileFields?: Array<{
      key: string;
      label: string;
      type?: string;
      options?: string[];
      required?: boolean;
      default?: string | number | boolean;
    }>;
  };
}

export type ProfileFieldDef = NonNullable<NonNullable<TemplateDetail["draft"]>["profileFields"]>[number];
