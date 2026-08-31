/** Canned TRF extraction for demo@doqseal.com (matches backend). */

export const DEMO_TRF_EXTRACTION = {
  document_type: "Lupin Diagnostics Test Requisition Form",
  category: "Medical",
  sub_category: "Laboratory",
  page_count: 1,
  suggested_title: "B Vijay Kumar — CBC, TSH",
  summary:
    "Lupin Diagnostics test requisition for patient B Vijay Kumar (58 years, Male). Client code CD/SLS 4378. Handwritten tests requested: CBC and TSH.",
  project_context:
    "TRF checklist: Patient Name, Age, Gender, Client Code, Test Requirements",
  pages: [{ page: 1, title: "Test Requisition Form" }],
  lab_name: "Lupin Diagnostics",
  patient_name: "B Vijay Kumar",
  patient_age: 58,
  patient_gender: "Male",
  client_code: "CD/SLS 4378",
  tests_requested: "CBC, TSH",
  auto_tags: [
    "lupin",
    "diagnostics",
    "trf",
    "laboratory",
    "cbc",
    "tsh",
    "handwritten",
  ],
  confidence_scores: {
    patient_name: 0.96,
    patient_age: 0.95,
    patient_gender: 0.97,
    client_code: 0.94,
    tests_requested: 0.95,
  },
} as const;

export type DemoTrfExtraction = typeof DEMO_TRF_EXTRACTION;

export function getDemoExtraction(_projectId?: string): DemoTrfExtraction {
  return {
    ...DEMO_TRF_EXTRACTION,
    confidence_scores: { ...DEMO_TRF_EXTRACTION.confidence_scores },
    pages: [...DEMO_TRF_EXTRACTION.pages],
    auto_tags: [...DEMO_TRF_EXTRACTION.auto_tags],
  };
}

export function getDemoConfidence(extracted: {
  confidence_scores: Record<string, number>;
}): number {
  const scores = Object.values(extracted.confidence_scores);
  if (!scores.length) return 0;
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

export function isPrescriptionExtraction(extracted: {
  prescription?: unknown;
}): boolean {
  return Boolean(extracted.prescription);
}

export const DEMO_EMAIL = "demo@doqseal.com";
export const DEMO_PROCESSING_MS = 8_000;

export function isDemoUserEmail(email?: string | null): boolean {
  return (email || "").trim().toLowerCase() === DEMO_EMAIL;
}

export const DEMO_PROCESSING_STEPS = [
  { atMs: 0, label: "Reading TRF page…" },
  { atMs: 1600, label: "Detecting Lupin Diagnostics requisition…" },
  { atMs: 3200, label: "Extracting patient name, age, and gender…" },
  { atMs: 4800, label: "Reading client code and test requirements…" },
  { atMs: 6400, label: "Finalizing CBC + TSH extraction…" },
] as const;
