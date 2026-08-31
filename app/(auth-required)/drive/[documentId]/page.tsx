"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Legacy path — redirect Drive deep links to the shared document viewer. */
export default function DriveDocumentRedirect() {
  const params = useParams<{ documentId: string }>();
  const router = useRouter();
  const documentId = String(params.documentId || "");

  useEffect(() => {
    if (documentId) {
      router.replace(`/documents/${documentId}`);
    } else {
      router.replace("/drive");
    }
  }, [documentId, router]);

  return null;
}
