import { getDemoConfidence, getDemoExtraction, DEMO_PROCESSING_MS } from "@/lib/demo-extraction";
import { getDocument, updateDocument } from "@/lib/document-store";

export async function processDocumentRecord(documentId: string): Promise<void> {
  const doc = await getDocument(documentId);
  if (!doc) return;

  await new Promise((resolve) => setTimeout(resolve, DEMO_PROCESSING_MS));

  const extractedJson = getDemoExtraction(doc.projectId);
  const confidence = getDemoConfidence(extractedJson);

  await updateDocument(documentId, {
    status: "completed",
    extractedJson,
    confidence,
    extractionStrategy: "demo",
    processedAt: new Date().toISOString(),
    processingError: undefined,
  });
}
