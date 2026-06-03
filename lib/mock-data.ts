/** Prototype data until backend APIs are wired */

export type DriveItem = {
  id: string;
  name: string;
  type: "folder" | "pdf" | "doc" | "image" | "csv";
  size?: string;
  modified: string;
  projectId?: string;
  signed?: boolean;
};

export type ProjectDocument = {
  name: string;
  status: "indexed" | "pending" | "signed";
};

export type Project = {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  memberCount: number;
  contextTokens: string;
  updatedAt: string;
  status: "active" | "archived";
  documents: ProjectDocument[];
};

export type SignEnvelope = {
  id: string;
  title: string;
  status: "draft" | "sent" | "in_progress" | "completed" | "voided";
  signers: { name: string; email: string; role: "signer" | "cc"; status: "pending" | "signed" }[];
  updatedAt: string;
  expiresAt?: string;
};

export const driveItems: DriveItem[] = [
  { id: "f1", name: "Patient intake forms", type: "folder", modified: "Today" },
  { id: "f2", name: "Insurance & TPA", type: "folder", modified: "Yesterday" },
  {
    id: "d1",
    name: "Test_Request_Form_Template_v2.pdf",
    type: "pdf",
    size: "420 KB",
    modified: "2h ago",
    projectId: "p-test-request",
    signed: true,
  },
  {
    id: "d2",
    name: "Prescription_Format_Dr_Sharma.pdf",
    type: "pdf",
    size: "180 KB",
    modified: "1d ago",
    projectId: "p-medical-prescription",
    signed: false,
  },
  {
    id: "d3",
    name: "Cashless_Approval_Letter_Sample.pdf",
    type: "pdf",
    size: "290 KB",
    modified: "3d ago",
    projectId: "p-insurance-documents",
  },
  {
    id: "d4",
    name: "NABL_Accreditation_Checklist.pdf",
    type: "pdf",
    size: "1.2 MB",
    modified: "1w ago",
    projectId: "p-test-request",
    signed: true,
  },
];

export const projects: Project[] = [
  {
    id: "p-test-request",
    name: "Test Request Form",
    description:
      "Test request forms for your diagnostic center. AI extracts center and officer stamps, patient name, age, sex, and clinical history from each uploaded document.",
    documentCount: 18,
    memberCount: 6,
    contextTokens:
      "AI reads from docs: Center Stamp · Patient Name · Age · Sex · Clinical History · Medical Officer Stamp · Medical Superintendent Stamp",
    updatedAt: "2 hours ago",
    status: "active",
    documents: [
      { name: "Test_Request_Form_Template_v2.pdf", status: "signed" },
      { name: "Panel_Master_CBC_LFT_KFT.pdf", status: "indexed" },
      { name: "Sample_Collection_Label_Standard.pdf", status: "indexed" },
      { name: "Referral_Form_Partner_Clinic.pdf", status: "indexed" },
      { name: "NABL_Accreditation_Checklist.pdf", status: "signed" },
    ],
  },
  {
    id: "p-medical-prescription",
    name: "Medical Prescription",
    description:
      "E-prescriptions, doctor letterheads, and medication instructions linked to lab orders—capture prescriber details and clinical notes for audit-ready records.",
    documentCount: 14,
    memberCount: 4,
    contextTokens:
      "Shared AI context: drug names, dosages, duration, contraindications, doctor registration (MCI/NMC)",
    updatedAt: "Yesterday",
    status: "active",
    documents: [
      { name: "Prescription_Format_Dr_Sharma.pdf", status: "indexed" },
      { name: "OPD_Prescription_Blank_A5.pdf", status: "indexed" },
      { name: "Medication_Instruction_Sheet.pdf", status: "indexed" },
      { name: "Doctor_Letterhead_Template.pdf", status: "pending" },
    ],
  },
  {
    id: "p-insurance-documents",
    name: "Insurance Documents",
    description:
      "TPA approvals, pre-auth forms, claim letters, and policy extracts for cashless and reimbursement flows at your diagnostic center.",
    documentCount: 22,
    memberCount: 5,
    contextTokens:
      "Shared AI context: insurer names, policy numbers, pre-auth IDs, coverage limits, ICD/CPT mapping",
    updatedAt: "3 days ago",
    status: "active",
    documents: [
      { name: "Cashless_Approval_Letter_Sample.pdf", status: "indexed" },
      { name: "Pre_Auth_Form_Star_Health.pdf", status: "indexed" },
      { name: "Claim_Submission_Checklist.pdf", status: "indexed" },
      { name: "TPA_MOU_ICICI_Lombard.pdf", status: "signed" },
      { name: "Policy_Exclusion_Summary_Template.pdf", status: "indexed" },
    ],
  },
];

export const signEnvelopes: SignEnvelope[] = [
  {
    id: "env-1",
    title: "Master Services Agreement — Acme",
    status: "in_progress",
    signers: [
      { name: "You", email: "owner@company.com", role: "signer", status: "signed" },
      { name: "Jane Acme", email: "jane@acme.com", role: "signer", status: "pending" },
      { name: "Legal", email: "legal@acme.com", role: "cc", status: "pending" },
    ],
    updatedAt: "1 hour ago",
    expiresAt: "Jun 15, 2026",
  },
  {
    id: "env-2",
    title: "Freelancer NDA — Dev contractor",
    status: "sent",
    signers: [
      { name: "You", email: "owner@company.com", role: "signer", status: "pending" },
      { name: "Alex Dev", email: "alex@freelance.io", role: "signer", status: "pending" },
    ],
    updatedAt: "Yesterday",
    expiresAt: "Jun 20, 2026",
  },
  {
    id: "env-3",
    title: "Statement of Work — Q3",
    status: "completed",
    signers: [
      { name: "You", email: "owner@company.com", role: "signer", status: "signed" },
      { name: "Client PM", email: "pm@client.com", role: "signer", status: "signed" },
    ],
    updatedAt: "Last week",
  },
];
