import { conflictFieldLabel, statusMeta } from "./status";
import type {
  BundleConflict,
  BundleDetail,
  BundleDocumentView,
  ChecklistItem,
  SlotDefinition,
  TimelineEntry,
} from "./types";

const SORTING = new Set(["pending", "queued", "classifying"]);

export type DocumentSortState = "sorting" | "needs_slot" | "sorted";

export function documentSortState(doc: BundleDocumentView): DocumentSortState {
  if (doc.typeKey) return "sorted";
  if (doc.classification && SORTING.has(doc.classification.status)) return "sorting";
  return "needs_slot";
}

export function isOpenConflict(c: BundleConflict): boolean {
  return (c.status ?? "open") === "open";
}

export function openConflicts(bundle: Pick<BundleDetail, "pipeline">): BundleConflict[] {
  return (bundle.pipeline?.conflicts ?? []).filter(isOpenConflict);
}

export interface SlotView {
  slot: SlotDefinition;
  documents: BundleDocumentView[];
  required: boolean;
  missing: boolean;
  received: number;
  overLimit: boolean;
  hasConflict: boolean;
}

/**
 * One entry per template slot with the documents placed in it. Required and
 * missing come from the latest evaluation (which applies profile conditions);
 * without one, the template's own required flag and minimum count are used.
 */
export function slotViews(bundle: BundleDetail): SlotView[] {
  const checklist = new Map<string, ChecklistItem>(
    (bundle.pipeline?.checklist ?? []).map((c) => [c.typeKey, c])
  );
  const defs: SlotDefinition[] = bundle.template?.documentTypes?.length
    ? bundle.template.documentTypes
    : (bundle.pipeline?.checklist ?? []).map((c) => ({
        key: c.typeKey,
        label: c.label,
        required: c.required,
        conditional: false,
        minCount: c.minCount,
        maxCount: c.maxCount,
      }));
  const conflictSlots = new Set(
    openConflicts(bundle).flatMap((c) => c.values.map((v) => v.typeKey).filter(Boolean) as string[])
  );

  return defs.map((slot) => {
    const documents = bundle.documents.filter((d) => d.typeKey === slot.key);
    const item = checklist.get(slot.key);
    const required = item ? item.required : slot.required;
    const minCount = Math.max(slot.minCount || 0, required ? 1 : 0);
    const missing = item
      ? item.status === "missing" || item.status === "insufficient"
      : required && documents.length < minCount;
    return {
      slot,
      documents,
      required,
      missing,
      received: documents.length,
      overLimit: slot.maxCount > 0 && documents.length > slot.maxCount,
      hasConflict: conflictSlots.has(slot.key),
    };
  });
}

/** Documents without a slot, split into those being sorted and those that need a person. */
export function unsortedDocuments(bundle: BundleDetail) {
  const sorting: BundleDocumentView[] = [];
  const needsSlot: BundleDocumentView[] = [];
  for (const doc of bundle.documents) {
    const state = documentSortState(doc);
    if (state === "sorting") sorting.push(doc);
    else if (state === "needs_slot") needsSlot.push(doc);
  }
  return { sorting, needsSlot };
}

export interface ReviewReadiness {
  canMark: boolean;
  alreadyReviewed: boolean;
  reasons: string[];
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

/** Mirrors the backend rule for POST /bundles/:id/review so the button explains itself. */
export function reviewReadiness(bundle: BundleDetail): ReviewReadiness {
  if (bundle.status === "ready" && bundle.review) {
    return { canMark: false, alreadyReviewed: true, reasons: [] };
  }
  const reasons: string[] = [];
  const { sorting, needsSlot } = unsortedDocuments(bundle);
  const missing = slotViews(bundle).filter((s) => s.missing).length;
  const conflicts = openConflicts(bundle).length;
  if (bundle.documents.length === 0) reasons.push("Add documents to this pack");
  if (sorting.length) reasons.push(`${plural(sorting.length, "document is", "documents are")} still being sorted`);
  if (needsSlot.length) reasons.push(`${plural(needsSlot.length, "document needs", "documents need")} a slot`);
  if (missing) reasons.push(`${plural(missing, "required item is", "required items are")} missing`);
  if (conflicts) reasons.push(`${plural(conflicts, "conflict is", "conflicts are")} open`);
  if (bundle.readOnly) reasons.push("This pack is read-only");
  if (!reasons.length && bundle.status !== "ready_to_run") {
    reasons.push("Refresh to pick up the latest checks");
  }
  return { canMark: reasons.length === 0, alreadyReviewed: false, reasons };
}

/** True while something is still changing on the server, so we poll faster. */
export function isBusy(bundle: BundleDetail | null): boolean {
  if (!bundle) return false;
  if (bundle.status === "running") return true;
  if ((bundle.pipeline?.documents?.inProgress ?? 0) > 0) return true;
  return bundle.documents.some(
    (d) =>
      documentSortState(d) === "sorting" ||
      d.extractionStatus === "queued" ||
      d.extractionStatus === "processing"
  );
}

export function documentLabel(doc: Pick<BundleDocumentView, "filename" | "restricted" | "available" | "documentId">): string {
  if (!doc.available) return "Deleted document";
  if (doc.restricted) return "Private document";
  return doc.filename || `Document ${doc.documentId.slice(0, 8)}`;
}

export function slotLabel(bundle: Pick<BundleDetail, "template">, key: string | null | undefined): string {
  if (!key) return "No slot";
  return bundle.template?.documentTypes?.find((d) => d.key === key)?.label ?? key.replace(/_/g, " ");
}

/**
 * Plain-language strength of an automatic suggestion. We deliberately show
 * words rather than percentages in the product.
 */
export function confidenceLabel(value: number | null | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value >= 0.8) return "strong match";
  if (value >= 0.5) return "possible match";
  return "weak match";
}

export interface SlotOption {
  key: string;
  label: string;
  suggested: boolean;
  hint: string | null;
}

/**
 * Slots a document can go into, with automatic suggestions first (best
 * first), then the remaining template slots in template order.
 */
export function slotOptions(bundle: Pick<BundleDetail, "template">, doc: BundleDocumentView): SlotOption[] {
  const defs = bundle.template?.documentTypes ?? [];
  const known = new Set(defs.map((d) => d.key));
  const scored = new Map<string, number>();
  const c = doc.classification;
  if (c?.suggestedTypeKey && known.has(c.suggestedTypeKey)) {
    scored.set(c.suggestedTypeKey, typeof c.confidence === "number" ? c.confidence : 0);
  }
  for (const alt of c?.alternatives ?? []) {
    if (!known.has(alt.slot)) continue;
    const prev = scored.get(alt.slot);
    if (prev === undefined || alt.confidence > prev) scored.set(alt.slot, alt.confidence);
  }
  const suggested = [...scored.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, conf]) => ({
      key,
      label: defs.find((d) => d.key === key)?.label ?? key,
      suggested: true,
      hint: key === c?.suggestedTypeKey ? `suggested, ${confidenceLabel(conf)}` : confidenceLabel(conf),
    }));
  const rest = defs
    .filter((d) => !scored.has(d.key))
    .map((d) => ({ key: d.key, label: d.label, suggested: false, hint: null }));
  return [...suggested, ...rest];
}

/** Plain-language line for a timeline entry. */
export function describeTimelineEntry(entry: TimelineEntry, bundle: BundleDetail | null): string {
  const d = entry.details as Record<string, unknown>;
  const doc = typeof d.documentId === "string" && bundle
    ? bundle.documents.find((x) => x.documentId === d.documentId)
    : undefined;
  const docName = doc ? documentLabel(doc) : typeof d.filename === "string" ? d.filename : "a document";
  const slot = (key: unknown) => (bundle ? slotLabel(bundle, typeof key === "string" ? key : null) : String(key ?? ""));
  const field = typeof d.field === "string" ? conflictFieldLabel(d.field) : "details";
  switch (entry.action) {
    case "bundle.create":
      return "Case pack created";
    case "bundle.update":
      return "Details updated";
    case "bundle.document_add":
      return `Added ${docName}`;
    case "bundle.document_remove":
      return `Removed ${docName}`;
    case "bundle.document_reassign":
      return `Moved ${docName} to ${slot(d.after)}`;
    case "bundle.document_queued":
      return `Sorting ${docName}`;
    case "bundle.document_classified":
      return d.status === "needs_review"
        ? `${docName} needs a slot`
        : `Sorted ${docName} into ${slot(d.typeKey)}`;
    case "bundle.document_classification_failed":
      return `Could not sort ${docName} automatically`;
    case "bundle.status_changed": {
      return `Status changed to ${statusMeta(String(d.to ?? "")).label.toLowerCase()}`;
    }
    case "bundle.conflicts_detected": {
      const fields = Array.isArray(d.fields) ? d.fields.map((f) => conflictFieldLabel(String(f))) : [];
      return fields.length ? `Conflict found: ${fields.join(", ")}` : "Conflict found";
    }
    case "bundle.conflict_resolved":
      return `Resolved ${field}`;
    case "bundle.conflict_dismissed":
      return `Dismissed ${field}`;
    case "bundle.conflict_reopened":
      return `Reopened ${field}`;
    case "bundle.reviewed":
      return "Marked reviewed";
    case "bundle.review_cleared":
      return "Review cleared after the pack changed";
    case "bundle.run":
      return "Checks started";
    case "bundle.delete":
      return "Case pack deleted";
    default:
      return entry.action.replace(/^bundle\./, "").replace(/_/g, " ");
  }
}
