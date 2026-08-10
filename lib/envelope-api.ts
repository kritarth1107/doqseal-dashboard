import type { FieldType, PlacedField, Signer } from "@/components/sign/types";
import { FIELD_META } from "@/lib/sign/constants";

type BackendFieldType = "signature" | "text" | "date" | "checkbox" | "initial";

function mapFieldType(type: FieldType): BackendFieldType {
  switch (type) {
    case "initials":
      return "initial";
    case "signature":
      return "signature";
    case "date":
      return "date";
    case "checkbox":
      return "checkbox";
    default:
      return "text";
  }
}

export function mapSignersToApi(
  signers: Signer[],
  userName: string,
  userEmail: string
) {
  return signers.map((signer, index) => ({
    name: signer.role === "self" ? signer.name || userName : signer.name,
    email:
      signer.role === "self"
        ? userEmail
        : signer.email.trim().toLowerCase(),
    role: "signer" as const,
    order: signer.order ?? index + 1,
  }));
}

export function mapFieldsToApi(fields: PlacedField[], signers: Signer[]) {
  return fields.map((field) => {
    const signerIndex = signers.findIndex((signer) => signer.id === field.signerId);

    return {
      type: mapFieldType(field.type),
      page: field.pageIndex + 1,
      x: field.xPercent,
      y: field.yPercent,
      width: field.widthPercent,
      height: field.heightPercent,
      signerIndex: signerIndex >= 0 ? signerIndex : 0,
      label: field.label || FIELD_META[field.type].label,
      required: field.required,
    };
  });
}

export function formatEnvelopeDate(value?: string | Date | null) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
