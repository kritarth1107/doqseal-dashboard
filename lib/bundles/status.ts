import type { BundleStatus } from "./types";

/**
 * Display copy for bundle statuses. Wording rules: the product flags and
 * routes items for people and leaves the decision on the case to them.
 */
export type StatusTone = "neutral" | "info" | "warning" | "success" | "danger";

export interface StatusMeta {
  label: string;
  description: string;
  tone: StatusTone;
}

const META: Record<BundleStatus, StatusMeta> = {
  collecting: {
    label: "Collecting",
    description: "Waiting for required documents.",
    tone: "neutral",
  },
  ready_to_run: {
    label: "Ready to review",
    description: "Every required slot is filled and nothing is open.",
    tone: "info",
  },
  running: {
    label: "Checking",
    description: "Checks are running on this pack.",
    tone: "info",
  },
  needs_review: {
    label: "Needs attention",
    description: "Some documents need a slot or some details differ between documents.",
    tone: "warning",
  },
  exceptions_found: {
    label: "Exceptions found",
    description: "Checks flagged items for a person to look at.",
    tone: "warning",
  },
  ready: {
    label: "Ready",
    description: "All items are settled.",
    tone: "success",
  },
  failed: {
    label: "Could not complete",
    description: "Something went wrong while checking this pack.",
    tone: "danger",
  },
  archived: {
    label: "Archived",
    description: "This pack is archived.",
    tone: "neutral",
  },
};

export function statusMeta(status: string, reviewed = false): StatusMeta {
  if (status === "ready" && reviewed) {
    return { label: "Reviewed", description: "A team member marked this pack reviewed.", tone: "success" };
  }
  return (
    META[status as BundleStatus] ?? {
      label: status.replace(/_/g, " "),
      description: "",
      tone: "neutral",
    }
  );
}

export const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  info: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  warning: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  danger: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

/** Status filter options for the list, in the order people work through them. */
export const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "needs_review,exceptions_found", label: "Needs attention" },
  { value: "collecting", label: "Collecting" },
  { value: "ready_to_run", label: "Ready to review" },
  { value: "ready", label: "Ready" },
  { value: "running", label: "Checking" },
  { value: "failed", label: "Could not complete" },
];

const FIELD_LABELS: Record<string, string> = {
  full_name: "Name",
  date_of_birth: "Date of birth",
  gender: "Gender",
  pan: "PAN",
  aadhaar_last4: "Aadhaar (last 4)",
};

export function conflictFieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field.replace(/_/g, " ");
}
