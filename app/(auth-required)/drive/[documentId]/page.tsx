"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function DriveDocumentRedirect() {
  const params = useParams<{ documentId: string }>();
  const router = useRouter();
  const documentId = String(params.documentId || "");

  useEffect(() => {
    router.replace(documentId ? `/view/${documentId}` : "/drive");
  }, [documentId, router]);

  return null;
}
