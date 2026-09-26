"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { slotOptions } from "@/lib/bundles/derive";
import type { BundleDetail, BundleDocumentView } from "@/lib/bundles/types";
import { INPUT_CLASS, PRIMARY_BUTTON } from "./ui";

/**
 * Lets a person choose the slot for a document. Suggestions from automatic
 * sorting are listed first so the likely answer is one click away.
 */
export function SlotPicker({
  bundle,
  doc,
  pending,
  onAssign,
  compact = false,
}: {
  bundle: BundleDetail;
  doc: BundleDocumentView;
  pending: boolean;
  onAssign: (typeKey: string) => void;
  compact?: boolean;
}) {
  const options = slotOptions(bundle, doc);
  const [value, setValue] = useState<string>(doc.typeKey ?? options.find((o) => o.suggested)?.key ?? "");

  if (compact) {
    return (
      <select
        aria-label="Move to slot"
        className={`${INPUT_CLASS} py-1.5 text-xs`}
        value={doc.typeKey ?? ""}
        disabled={pending || bundle.readOnly}
        onChange={(e) => e.target.value && onAssign(e.target.value)}
      >
        {!doc.typeKey && <option value="">Choose a slot…</option>}
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <select
        aria-label="Slot for this document"
        className={`${INPUT_CLASS} sm:flex-1`}
        value={value}
        disabled={pending || bundle.readOnly}
        onChange={(e) => setValue(e.target.value)}
      >
        <option value="">Choose a slot…</option>
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
            {o.hint ? ` (${o.hint})` : ""}
          </option>
        ))}
      </select>
      <button
        type="button"
        className={PRIMARY_BUTTON}
        disabled={!value || pending || bundle.readOnly || value === doc.typeKey}
        onClick={() => onAssign(value)}
      >
        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
        Place in slot
      </button>
    </div>
  );
}
