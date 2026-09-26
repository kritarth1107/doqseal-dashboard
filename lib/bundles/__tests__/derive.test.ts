import { describe, expect, it } from "vitest";
import {
  confidenceLabel,
  describeTimelineEntry,
  documentLabel,
  documentSortState,
  isBusy,
  openConflicts,
  reviewReadiness,
  slotOptions,
  slotViews,
  unsortedDocuments,
} from "../derive";
import { bundle, doc } from "./fixtures";
import type { BundleConflict, PipelineSummary } from "../types";

const conflict = (overrides: Partial<BundleConflict> = {}): BundleConflict => ({
  field: "full_name",
  message: "Names differ",
  severity: "review",
  values: [
    { documentId: "d1", typeKey: "pan_card", value: "PRIYA SHARMA" },
    { documentId: "d2", typeKey: "bank_statement", value: "PRIYA S" },
  ],
  valuesHash: "h1",
  status: "open",
  ...overrides,
});

const pipeline = (overrides: Partial<PipelineSummary> = {}): PipelineSummary => ({
  evaluatedAt: "2026-09-26T10:00:00Z",
  documents: { total: 0, inProgress: 0, classified: 0, needsReview: 0, failed: 0, unassigned: 0 },
  checklist: [],
  missing: [],
  conflicts: [],
  ...overrides,
});

describe("documentSortState", () => {
  it("is sorted once a slot is set", () => {
    expect(documentSortState(doc({ typeKey: "pan_card" }))).toBe("sorted");
  });
  it("is sorting while classification is in flight", () => {
    for (const status of ["pending", "queued", "classifying"] as const) {
      expect(
        documentSortState(doc({ classification: { status, suggestedTypeKey: null, confidence: null, alternatives: [], reasons: [], lastError: null } }))
      ).toBe("sorting");
    }
  });
  it("needs a slot when unassigned and idle (including no classification at all)", () => {
    expect(documentSortState(doc())).toBe("needs_slot");
    expect(
      documentSortState(doc({ classification: { status: "needs_review", suggestedTypeKey: "pan_card", confidence: 0.4, alternatives: [], reasons: [], lastError: null } }))
    ).toBe("needs_slot");
  });
});

describe("slotViews", () => {
  it("uses template requirements when there is no evaluation yet", () => {
    const views = slotViews(bundle({ documents: [doc({ typeKey: "pan_card" })] }));
    expect(views.map((v) => [v.slot.key, v.missing, v.received])).toEqual([
      ["pan_card", false, 1],
      ["bank_statement", true, 0],
      ["form16", false, 0],
    ]);
  });

  it("prefers the evaluated checklist, which applies case conditions", () => {
    const views = slotViews(
      bundle({
        pipeline: pipeline({
          checklist: [
            { typeKey: "pan_card", label: "PAN card", required: true, received: 0, minCount: 1, maxCount: 1, status: "missing" },
            { typeKey: "form16", label: "Form 16", required: true, received: 0, minCount: 1, maxCount: 0, status: "missing" },
          ],
        }),
      })
    );
    const form16 = views.find((v) => v.slot.key === "form16")!;
    expect(form16.required).toBe(true);
    expect(form16.missing).toBe(true);
  });

  it("highlights slots involved in an open conflict and flags over-limit slots", () => {
    const b = bundle({
      documents: [doc({ documentId: "d1", typeKey: "pan_card" }), doc({ documentId: "d3", typeKey: "pan_card" })],
      pipeline: pipeline({ conflicts: [conflict()] }),
    });
    const pan = slotViews(b).find((v) => v.slot.key === "pan_card")!;
    expect(pan.hasConflict).toBe(true);
    expect(pan.overLimit).toBe(true);
  });

  it("ignores resolved and dismissed conflicts", () => {
    const b = bundle({ pipeline: pipeline({ conflicts: [conflict({ status: "resolved" }), conflict({ field: "pan", status: "dismissed" })] }) });
    expect(openConflicts(b)).toHaveLength(0);
    expect(slotViews(b).some((v) => v.hasConflict)).toBe(false);
  });
});

describe("reviewReadiness", () => {
  const complete = () =>
    bundle({
      status: "ready_to_run",
      documents: [doc({ documentId: "d1", typeKey: "pan_card" }), doc({ documentId: "d2", typeKey: "bank_statement" })],
    });

  it("allows marking reviewed when nothing is open", () => {
    expect(reviewReadiness(complete())).toEqual({ canMark: true, alreadyReviewed: false, reasons: [] });
  });

  it("explains each open item", () => {
    const b = bundle({
      status: "needs_review",
      documents: [doc({ documentId: "d9" })],
      pipeline: pipeline({ conflicts: [conflict()] }),
    });
    const r = reviewReadiness(b);
    expect(r.canMark).toBe(false);
    expect(r.reasons).toEqual([
      "1 document needs a slot",
      "2 required items are missing",
      "1 conflict is open",
    ]);
  });

  it("asks for documents on an empty pack", () => {
    expect(reviewReadiness(bundle()).reasons[0]).toBe("Add documents to this pack");
  });

  it("waits for the server when the status has not caught up", () => {
    const r = reviewReadiness({ ...complete(), status: "collecting" });
    expect(r.canMark).toBe(false);
    expect(r.reasons).toEqual(["Refresh to pick up the latest checks"]);
  });

  it("reports an existing review", () => {
    const r = reviewReadiness({
      ...complete(),
      status: "ready",
      reviewed: true,
      review: { reviewedAt: "2026-09-26T10:00:00Z", note: null, reviewer: { userId: "u1", name: "Asha" } },
    });
    expect(r.alreadyReviewed).toBe(true);
  });
});

describe("slotOptions", () => {
  it("puts suggestions first, strongest first, without percentages", () => {
    const options = slotOptions(
      bundle(),
      doc({
        classification: {
          status: "needs_review",
          suggestedTypeKey: "bank_statement",
          confidence: 0.55,
          alternatives: [
            { slot: "pan_card", confidence: 0.9 },
            { slot: "unknown_slot", confidence: 0.99 },
          ],
          reasons: [],
          lastError: null,
        },
      })
    );
    expect(options.map((o) => o.key)).toEqual(["pan_card", "bank_statement", "form16"]);
    expect(options[0].hint).toBe("strong match");
    expect(options[1].hint).toBe("suggested, possible match");
    expect(options[2]).toMatchObject({ suggested: false, hint: null });
    expect(options.some((o) => /\d/.test(o.hint ?? ""))).toBe(false);
  });

  it("lists every slot when there is no suggestion", () => {
    expect(slotOptions(bundle(), doc()).every((o) => !o.suggested)).toBe(true);
  });
});

describe("helpers", () => {
  it("confidenceLabel maps to words", () => {
    expect(confidenceLabel(0.95)).toBe("strong match");
    expect(confidenceLabel(0.6)).toBe("possible match");
    expect(confidenceLabel(0.1)).toBe("weak match");
    expect(confidenceLabel(null)).toBeNull();
  });

  it("documentLabel hides names the viewer cannot see", () => {
    expect(documentLabel(doc({ restricted: true, filename: null }))).toBe("Private document");
    expect(documentLabel(doc({ available: false }))).toBe("Deleted document");
    expect(documentLabel(doc({ filename: null, documentId: "abcdefghij" }))).toBe("Document abcdefgh");
  });

  it("unsortedDocuments splits sorting and waiting documents", () => {
    const b = bundle({
      documents: [
        doc({ documentId: "a", typeKey: "pan_card" }),
        doc({ documentId: "b", classification: { status: "queued", suggestedTypeKey: null, confidence: null, alternatives: [], reasons: [], lastError: null } }),
        doc({ documentId: "c" }),
      ],
    });
    const u = unsortedDocuments(b);
    expect(u.sorting.map((d) => d.documentId)).toEqual(["b"]);
    expect(u.needsSlot.map((d) => d.documentId)).toEqual(["c"]);
  });

  it("isBusy is true while anything is still changing", () => {
    expect(isBusy(null)).toBe(false);
    expect(isBusy(bundle())).toBe(false);
    expect(isBusy(bundle({ status: "running" }))).toBe(true);
    expect(isBusy(bundle({ documents: [doc({ typeKey: "pan_card", extractionStatus: "processing" })] }))).toBe(true);
  });

  it("describes timeline entries in plain language", () => {
    const b = bundle({ documents: [doc({ documentId: "d1", filename: "pan.pdf" })] });
    const entry = (action: string, details: Record<string, unknown> = {}) => ({
      id: "e",
      action,
      timestamp: "2026-09-26T10:00:00Z",
      actor: { userId: "u", name: "Asha", isSystem: false },
      details,
    });
    expect(describeTimelineEntry(entry("bundle.document_reassign", { documentId: "d1", after: "pan_card" }), b)).toBe(
      "Moved pan.pdf to PAN card"
    );
    expect(describeTimelineEntry(entry("bundle.conflict_dismissed", { field: "full_name" }), b)).toBe("Dismissed Name");
    expect(describeTimelineEntry(entry("bundle.status_changed", { to: "needs_review" }), b)).toBe(
      "Status changed to needs attention"
    );
    expect(describeTimelineEntry(entry("bundle.reviewed"), b)).toBe("Marked reviewed");
  });
});
