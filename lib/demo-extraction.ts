import {
  ExtractedDocument,
  VERIFICATION_PASSED,
} from "@/types/extraction";

/** Canned TRF + billing extraction for demo@doqseal.com (matches backend). */
export const DEMO_TRF_EXTRACTION: ExtractedDocument & {
  suggested_title?: string;
  summary?: string;
  project_context?: string;
  pages?: Array<{ page: number; title: string }>;
} = {
  document_type: "Medical Radiology Requisition + Billing Receipt",
  category: "Medical",
  sub_category: "Radiology",
  page_count: 2,
  suggested_title: "Dnyaneshwar Shyamrao Munde — CT Ankle",
  summary:
    "Two-page NHM free-diagnostic pack from Krsnaa Diagnostics (Sub District Hospital, Parli). Page 1 is the radiology TRF / requisition for CT Limbs Without Contrast (clinical history: CT Ankle). Page 2 is the CREDIT billing receipt (₹1,200 gross/net, unpaid balance). Patient is BPL with centre, referring doctor, diagnostic coordinator, medical superintendent, and patient signatures present.",
  project_context:
    "TRF checklist: Center Stamp, Patient Name, Age, Sex, Clinical History, Medical Officer Stamp, Medical Superintendent Stamp",
  pages: [
    { page: 1, title: "Radiology Requisition" },
    { page: 2, title: "Billing Receipt" },
  ],
  institution: {
    name: "Krsnaa Diagnostics Ltd.",
    branch: "Sub District Hospital, Parli",
    scheme: "NHM Free Diagnostic Initiative",
    gst_number: "27AAECK2179H2ZD",
    cin: "U74900PN2010PLC138068",
    pin: "431515",
  },
  patient: {
    name: "Dnyaneshwar Shyamrao Munde",
    age: 36,
    gender: "M",
    address: "At Post - Parli V",
    patient_code: "PARLI260300022531",
    patient_type: "BPL",
    contact: "9320397617",
  },
  referral: {
    referred_by: "Dr. Dhiraj Kedar",
    clinical_history: "CT Ankle",
  },
  visit: {
    date: "2026-03-07",
    time: "15:28",
    rec_number: "OPD/47903961",
    ipd_opd: "289/96",
    bill_type: "CREDIT",
  },
  tests: {
    requested: ["CT Limbs Without Contrast"],
    section: "CT SCAN",
  },
  billing: {
    gross: 1200.0,
    net: 1200.0,
    paid: 0.0,
    balance: 1200.0,
    currency: "INR",
    amount_in_words: "One Thousand Two Hundred Only",
  },
  verification: { ...VERIFICATION_PASSED },
  auto_tags: [
    "medical",
    "radiology",
    "CT scan",
    "government",
    "NHM",
    "Maharashtra",
    "BPL",
    "free diagnostic",
    "billing",
  ],
  confidence_scores: {
    patient_name: 0.91,
    patient_code: 0.98,
    rec_number: 0.97,
    billing_amount: 0.99,
    tests_requested: 0.85,
    clinical_history: 0.61,
    referred_by: 0.94,
    date: 0.96,
  },
};

export function getDemoExtraction(_projectId?: string): ExtractedDocument {
  return {
    ...DEMO_TRF_EXTRACTION,
    confidence_scores: { ...DEMO_TRF_EXTRACTION.confidence_scores },
  };
}

export function getDemoConfidence(extracted: ExtractedDocument): number {
  const scores = Object.values(extracted.confidence_scores);
  if (!scores.length) return 0;
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

export function isPrescriptionExtraction(extracted: ExtractedDocument): boolean {
  return Boolean(extracted.prescription);
}

export const DEMO_EMAIL = "demo@doqseal.com";
export const DEMO_PROCESSING_MS = 8_000;

export function isDemoUserEmail(email?: string | null): boolean {
  return (email || "").trim().toLowerCase() === DEMO_EMAIL;
}

export const DEMO_PROCESSING_STEPS = [
  { atMs: 0, label: "Reading document pages…" },
  { atMs: 1600, label: "Detecting document type (radiology TRF + billing)…" },
  { atMs: 3200, label: "Extracting patient, visit, and referral fields…" },
  { atMs: 4800, label: "Checking stamps & signatures against project checklist…" },
  { atMs: 6400, label: "Finalizing structured extraction…" },
] as const;
