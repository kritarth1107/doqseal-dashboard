"use client";

import { useParams } from "next/navigation";
import { DocumentDetailView } from "@/components/documents/DocumentDetailView";

export default function DocumentPage() {
  const params = useParams<{ documentId: string }>();
  const documentId = String(params.documentId || "");

  return (
    <DocumentDetailView
      documentId={documentId}
      backHref="/drive"
      backLabel="Back to Drive"
    />
  );
}
