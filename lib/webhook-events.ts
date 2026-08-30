export const WEBHOOK_EVENTS = [
  "document.uploaded",
  "document.processing",
  "document.processed",
  "document.failed",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export type ProjectWebhook = {
  url: string;
  events: WebhookEvent[];
  enabled?: boolean;
};

export const WEBHOOK_EVENT_META: Record<
  WebhookEvent,
  { label: string; description: string }
> = {
  "document.uploaded": {
    label: "Uploaded",
    description: "File saved and job created",
  },
  "document.processing": {
    label: "Processing",
    description: "AI started extracting",
  },
  "document.processed": {
    label: "Processed",
    description: "Extraction succeeded",
  },
  "document.failed": {
    label: "Failed",
    description: "Extraction failed",
  },
};
