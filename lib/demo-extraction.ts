import {
  ExtractedDocument,
  VERIFICATION_PASSED,
} from "@/types/extraction";
import { isPrescriptionProject } from "@/lib/project-config";

const AFSANA_PATIENT: ExtractedDocument["patient"] = {
  name: "Mrs Afsana Ambir Pinjari",
  age: 36,
  gender: "F",
  address: "At Post-Parli, V",
  patient_code: "PARLI260300022533",
  patient_type: "BPL",
  contact: "8975670107",
};

const AFSANA_INSTITUTION: ExtractedDocument["institution"] = {
  name: "Krsnaa Diagnostics Ltd.",
  branch: "CT Scan Dept., Sub District Hospital, Parli, Dist. Beed",
  scheme: "NHM Free Diagnostic Initiative",
  gst_number: "27AAECK2179H2ZD",
  cin: "U74900PN2010PLC138068",
  pin: "431515",
};

/** Demo extraction for Afsana Pinjari TRF + billing receipt (Parli, Beed). */
function getTrfDemoExtraction(): ExtractedDocument {
  return {
    document_type: "TRF (Test Request Form) + Billing Receipt",
    category: "Medical",
    sub_category: "Radiology",
    page_count: 2,
    institution: { ...AFSANA_INSTITUTION },
    patient: { ...AFSANA_PATIENT },
    referral: {
      referred_by: "Dr. Rafat Rehman",
      clinical_history: "CT Abd & spine",
    },
    visit: {
      date: "2026-03-07",
      time: "16:01",
      rec_number: "OPD/47904775",
      ipd_opd: "28768",
      bill_type: "CREDIT",
    },
    tests: {
      requested: [
        "CT Whole Abdomen without Contrast",
        "CT Spine (Cervical, Dorsal, Lumbar, Sacral) without contrast",
        "CT WHOLE ABDOMEN PLAIN",
      ],
      section: "CT Scan",
    },
    billing: {
      gross: 2400,
      net: 2400,
      paid: 0,
      balance: 2400,
      currency: "INR",
      amount_in_words: "TWO THOUSAND FOUR HUNDRED ONLY",
    },
    verification: { ...VERIFICATION_PASSED },
    auto_tags: ["Radiology", "CT Scan", "NHM", "BPL", "Parli", "Afsana Pinjari"],
    confidence_scores: {
      patient_name: 0.92,
      age: 0.95,
      clinical_history: 0.88,
      billing: 0.97,
    },
  };
}

/** Demo extraction — prescription (Afsana Pinjari); hospital matches TRF. */
export function getPrescriptionDemoExtraction(): ExtractedDocument {
  return {
    document_type: "Medical Prescription",
    category: "Medical",
    sub_category: "Prescription",
    page_count: 1,
    institution: { ...AFSANA_INSTITUTION },
    patient: { ...AFSANA_PATIENT },
    referral: {
      referred_by: "Dr. Satish Kumar Jyoti",
      clinical_history: "Acute febrile illness",
    },
    visit: {
      date: "2024-05-13",
      time: "12:08",
      rec_number: "OPD Prescription",
      ipd_opd: "OPD",
      bill_type: "OPD",
    },
    tests: {
      requested: [],
      section: "",
    },
    prescription: {
      prescriber: "Dr. Satish Kumar Jyoti",
      registration_no: "Consultant — General Medicine",
      diagnosis: "Acute febrile illness",
      medications: [
        {
          name: "Tab. HIFENAC-P",
          dosage: "Twice after food",
          duration: "3 days",
          instructions: "Oral",
        },
        {
          name: "Tab. DOLO 650mg",
          dosage: "SOS",
          duration: "As needed",
          instructions: "Oral",
        },
        {
          name: "Tab. CEFTAS 200mg",
          dosage: "Twice after food",
          duration: "7 days",
          instructions: "Oral",
        },
        {
          name: "Tab. URSOCOL 300mg",
          dosage: "Twice after food",
          duration: "10 days",
          instructions: "Oral",
        },
      ],
      advice:
        "Continue other medicines as advised. Valid before 19-May-2024. Patient: Afsana Pinjari. Emergency: 0771-2513500 / 9300373737.",
    },
    billing: {
      gross: 0,
      net: 0,
      paid: 0,
      balance: 0,
      currency: "INR",
      amount_in_words: "",
    },
    verification: {
      centre_stamp: true,
      referring_doctor_signature: true,
      diagnostic_coordinator_signature: false,
      medical_superintendent_signature: false,
      patient_signature: false,
      user_signature: true,
    },
    auto_tags: ["Prescription", "Febrile illness", "Afsana Pinjari", "Parli", "NHM"],
    confidence_scores: {
      patient_name: 0.94,
      prescriber: 0.91,
      medications: 0.92,
      diagnosis: 0.90,
    },
  };
}

export function getDemoExtraction(projectId: string): ExtractedDocument {
  if (isPrescriptionProject(projectId)) {
    return getPrescriptionDemoExtraction();
  }
  return getTrfDemoExtraction();
}

export function getDemoConfidence(extracted: ExtractedDocument): number {
  const scores = Object.values(extracted.confidence_scores);
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

export function isPrescriptionExtraction(extracted: ExtractedDocument): boolean {
  return Boolean(extracted.prescription);
}
