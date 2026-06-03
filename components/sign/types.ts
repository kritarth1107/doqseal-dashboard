export type FieldType =
  | "signature"
  | "initials"
  | "date"
  | "text"
  | "checkbox"
  | "name"
  | "email";

/** self = only me | request = only others | mixed = me + others */
export type EnvelopeMode = "self" | "request" | "mixed";

export type SignerRole = "self" | "signer" | "cc";

export type Signer = {
  id: string;
  name: string;
  email: string;
  color: string;
  role: SignerRole;
  order: number;
};

export type SignatureMethod = "draw" | "type" | "upload";

export type SignatureProfile = {
  method: SignatureMethod;
  /** PNG data URL for draw/upload */
  imageDataUrl?: string;
  /** Typed signature */
  typedText?: string;
  fontFamily?: string;
};

export type PlacedField = {
  id: string;
  type: FieldType;
  signerId: string;
  pageIndex: number;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  required: boolean;
  placeholder?: string;
  label?: string;
};

export type StudioStep = "document" | "prepare" | "review";
