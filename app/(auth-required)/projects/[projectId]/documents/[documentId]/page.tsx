"use client";

import { useParams } from "next/navigation";
import { DocumentDetailView } from "@/components/documents/DocumentDetailView";

export default function ProjectDocumentPage() {
  const params = useParams<{ projectId: string; documentId: string }>();
  const projectId = String(params.projectId);
  const documentId = String(params.documentId);

  return (
    <DocumentDetailView
      documentId={documentId}
      expectedProjectId={projectId}
      backHref={`/projects/${projectId}`}
      backLabel="Back to project"
    />
  );
}
