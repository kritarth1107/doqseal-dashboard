import type { FieldType } from "@/components/sign/types";

export const SIGNER_COLORS = [
  "#4F46E5",
  "#059669",
  "#D97706",
  "#DB2777",
  "#0891B2",
  "#7C3AED",
  "#DC2626",
];

export const FIELD_META: Record<
  FieldType,
  { label: string; widthPercent: number; heightPercent: number; shortLabel: string; placeholder: string }
> = {
  signature: { label: "Signature", shortLabel: "Sign", widthPercent: 26, heightPercent: 9, placeholder: "Sign here" },
  initials: { label: "Initials", shortLabel: "Init", widthPercent: 12, heightPercent: 6, placeholder: "AB" },
  date: { label: "Date signed", shortLabel: "Date", widthPercent: 18, heightPercent: 6, placeholder: "MM/DD/YYYY" },
  text: { label: "Text", shortLabel: "Text", widthPercent: 28, heightPercent: 6, placeholder: "Enter text" },
  checkbox: { label: "Checkbox", shortLabel: "Check", widthPercent: 4, heightPercent: 4, placeholder: "" },
  name: { label: "Name", shortLabel: "Name", widthPercent: 28, heightPercent: 6, placeholder: "Full name" },
  email: { label: "Email", shortLabel: "Email", widthPercent: 30, heightPercent: 6, placeholder: "email@company.com" },
};

export const SIGNATURE_FONTS = [
  { id: "cursive", label: "Handwritten", family: "'Segoe Script', 'Brush Script MT', cursive" },
  { id: "elegant", label: "Elegant", family: "Georgia, 'Times New Roman', serif" },
  { id: "modern", label: "Modern", family: "system-ui, sans-serif" },
];

export const SELF_SIGNER_ID = "self";

/** Fixed raster scale — zoom uses CSS transform to avoid re-render flicker */
export const BASE_PDF_SCALE = 1.25;

export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 1.75;
export const ZOOM_STEP = 0.1;

export function isInputFieldType(type: FieldType): boolean {
  return type === "text" || type === "name" || type === "email" || type === "date";
}

export function isSignatureFieldType(type: FieldType): boolean {
  return type === "signature" || type === "initials";
}
