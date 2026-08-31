/** Canned TRF extraction for demo@doqseal.com (matches backend variants). */

export type DemoTrfExtraction = {
  document_type: string;
  category: string;
  sub_category: string;
  page_count: number;
  suggested_title: string;
  summary: string;
  project_context: string;
  pages: Array<{ page: number; title: string }>;
  lab_name: string;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  client_code: string;
  tests_requested: string;
  auto_tags: string[];
  confidence_scores: Record<string, number>;
};

const BASE = {
  document_type: "Lupin Diagnostics Test Requisition Form",
  category: "Medical",
  sub_category: "Laboratory",
  page_count: 1,
  project_context:
    "TRF checklist: Patient Name, Age, Gender, Client Code, Test Requirements",
  pages: [{ page: 1, title: "Test Requisition Form" }] as Array<{
    page: number;
    title: string;
  }>,
  lab_name: "Lupin Diagnostics",
  confidence_scores: {
    patient_name: 0.96,
    patient_age: 0.95,
    patient_gender: 0.97,
    client_code: 0.94,
    tests_requested: 0.95,
  } as Record<string, number>,
};

const VARIANTS: Array<DemoTrfExtraction & { match: string[] }> = [
  {
    match: ["12.53.21 pm (1)", "aachal"],
    ...BASE,
    suggested_title: "Aachal Singh — Blood Group, TFT, HBsAg",
    summary:
      "Lupin Diagnostics TRF for patient Aachal Singh (23 years, Female). Client code STSQ315. Tests requested: Blood Group, Thyroid Function Test (TFT), and Hepatitis B Surface Antigen (HBsAg).",
    patient_name: "Aachal Singh",
    patient_age: 23,
    patient_gender: "Female",
    client_code: "STSQ315",
    tests_requested:
      "Blood Group (B group), Thyroid Function Test (TFT), Hepatitis B Surface Antigen (HBsAg)",
    auto_tags: ["lupin", "trf", "blood group", "tft", "hbsag"],
  },
  {
    match: ["12.53.21 pm.jpeg", "12.53.21 pm.jpg", "yogesh"],
    ...BASE,
    suggested_title: "Yogesh Mehta — Creatinine, Urea, Lipid Profile",
    summary:
      "Lupin Diagnostics TRF for patient Yogesh Mehta (52 years, Male). Client code not filled on the form. Tests requested: Creatinine, Urea, and Lipid Profile.",
    patient_name: "Yogesh Mehta",
    patient_age: 52,
    patient_gender: "Male",
    client_code: "Not filled",
    tests_requested: "Creatinine (Creat), Urea, Lipid Profile (Lipid pr)",
    auto_tags: ["lupin", "trf", "creatinine", "urea", "lipid"],
  },
  {
    match: ["12.53.22 pm (1)", "karan"],
    ...BASE,
    suggested_title: "Karan Vashan — CBC, CRP, ESR",
    summary:
      "Lupin Diagnostics TRF for patient Karan Vashan (19 years, Male). Client code PUP 4502. Tests requested: Complete Blood Count (CBC), C-Reactive Protein (CRP), and Erythrocyte Sedimentation Rate (ESR).",
    patient_name: "Karan Vashan",
    patient_age: 19,
    patient_gender: "Male",
    client_code: "PUP 4502",
    tests_requested:
      "Complete Blood Count (CBC), C-Reactive Protein (CRP), Erythrocyte Sedimentation Rate (ESR)",
    auto_tags: ["lupin", "trf", "cbc", "crp", "esr"],
  },
  {
    match: ["12.53.22 pm (2)", "sahil", "shirke"],
    ...BASE,
    suggested_title: "Sahil Shirke — HbA1c, Lipid Profile, CBC",
    summary:
      "Lupin Diagnostics TRF for patient Sahil Shirke (28 years, Male). Client code PUP 1041. Tests requested: Glycated Hemoglobin (HbA1c), Lipid Profile, and Complete Blood Count (CBC).",
    patient_name: "Sahil Shirke",
    patient_age: 28,
    patient_gender: "Male",
    client_code: "PUP 1041",
    tests_requested:
      "Glycated Hemoglobin (HbA1c), Lipid Profile, Complete Blood Count (CBC)",
    auto_tags: ["lupin", "trf", "hba1c", "lipid", "cbc"],
  },
  {
    match: ["12.53.22 pm.jpeg", "12.53.22 pm.jpg", "vijay"],
    ...BASE,
    suggested_title: "B Vijay Kumar — CBC, TSH",
    summary:
      "Lupin Diagnostics TRF for patient B Vijay Kumar (58 years, Male). Client code CD/SLS 4378. Tests requested: Complete Blood Count (CBC) and Thyroid Stimulating Hormone (TSH).",
    patient_name: "B Vijay Kumar",
    patient_age: 58,
    patient_gender: "Male",
    client_code: "CD/SLS 4378",
    tests_requested:
      "Complete Blood Count (CBC), Thyroid Stimulating Hormone (TSH)",
    auto_tags: ["lupin", "trf", "cbc", "tsh"],
  },
];

export const DEMO_TRF_EXTRACTION = VARIANTS[4];

export function resolveDemoExtraction(filename?: string | null): DemoTrfExtraction {
  const name = (filename || "")
    .toLowerCase()
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const hit =
    VARIANTS.find((v) => v.match.some((m) => name.includes(m))) ||
    DEMO_TRF_EXTRACTION;
  return {
    ...hit,
    pages: [...hit.pages],
    auto_tags: [...hit.auto_tags],
    confidence_scores: { ...hit.confidence_scores },
  };
}

export function getDemoExtraction(
  _projectId?: string,
  filename?: string | null
): DemoTrfExtraction {
  return resolveDemoExtraction(filename);
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
  { atMs: 3200, label: "Extracting patient name, age, gender, and client code…" },
  { atMs: 4800, label: "Expanding test names to full forms…" },
  { atMs: 6400, label: "Finalizing structured extraction…" },
] as const;
