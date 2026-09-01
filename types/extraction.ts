export interface ExtractedDocument {
  document_type: string;
  category: string;
  sub_category: string;
  page_count: number;

  institution: {
    name: string;
    branch: string;
    scheme: string;
    gst_number: string;
    cin: string;
    pin: string;
  };

  patient: {
    name: string;
    age: number | null;
    gender: string;
    address: string;
    patient_code: string;
    patient_type: string;
    contact: string;
  };

  referral: {
    referred_by: string;
    clinical_history: string;
  };

  visit: {
    date: string;
    time: string;
    rec_number: string;
    ipd_opd: string;
    bill_type: string;
  };

  tests: {
    requested: string[];
    section: string;
  };

  prescription?: {
    prescriber: string;
    registration_no: string;
    diagnosis: string;
    medications: {
      name: string;
      dosage: string;
      duration: string;
      instructions: string;
    }[];
    advice: string;
  };

  billing: {
    gross: number;
    net: number;
    paid: number;
    balance: number;
    currency: string;
    amount_in_words: string;
  };

  verification: {
    centre_stamp: boolean;
    referring_doctor_signature: boolean;
    diagnostic_coordinator_signature: boolean;
    medical_superintendent_signature: boolean;
    patient_signature: boolean;
    user_signature: boolean;
  };

  auto_tags: string[];
  confidence_scores: Record<string, number>;
}

export const VERIFICATION_PASSED: ExtractedDocument["verification"] = {
  centre_stamp: true,
  referring_doctor_signature: true,
  diagnostic_coordinator_signature: true,
  medical_superintendent_signature: true,
  patient_signature: true,
  user_signature: true,
};

export type DocumentStatus =
  | "uploaded"
  | "processing"
  | "completed"
  | "needs_review"
  | "failed";

export type StoredDocument = {
  id: string;
  projectId: string | null;
  jobId?: string;
  originalFilename: string;
  displayTitle?: string | null;
  storedFilename: string;
  mimeType: string;
  size: number;
  status: DocumentStatus;
  extractedJson: ExtractedDocument | Record<string, unknown> | null;
  fieldConfidence?: Record<string, number>;
  confidence: number;
  extractionStrategy: string;
  uploadedAt: string;
  processedAt?: string;
  processingError?: string;
  filePurgedAt?: string | null;
  retentionDays?: number | null;
  keepForever?: boolean;
  fileExpiresAt?: string | null;
  uploadedBy?: string;
  contentHash?: string;
  sharedWithOrganisation?: boolean;
  demoMode?: boolean;
  demoRevealAt?: string | null;
};
