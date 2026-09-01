import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch, parseBackendJson } from "@/lib/backend-client";
import { mapBackendDocumentList } from "@/lib/document-api";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

async function requireSession() {
  const cookieStore = await cookies();
  return cookieStore.get("session_token")?.value ?? null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 400 });
    }

    const consent = formData.get("consent");
    if (consent !== "true") {
      return NextResponse.json({ error: "Consent is required before upload" }, { status: 400 });
    }

    const backendForm = new FormData();
    backendForm.append("file", file);
    backendForm.append("projectId", projectId);
    backendForm.append("consent", "true");
    const shared = formData.get("sharedWithOrganisation");
    backendForm.append(
      "sharedWithOrganisation",
      shared === "false" || shared === "0" ? "false" : "true"
    );

    const keepForever = formData.get("keepForever");
    if (keepForever === "true" || keepForever === "1") {
      backendForm.append("keepForever", "true");
    }
    const retentionDays = formData.get("retentionDays");
    if (typeof retentionDays === "string" && retentionDays.trim()) {
      backendForm.append("retentionDays", retentionDays.trim());
    }

    const response = await backendFetch(request, "documents/upload", {
      method: "POST",
      body: backendForm,
    });

    const payload = await parseBackendJson<{
      documentId: string;
      jobId: string;
      status: string;
      message: string;
    }>(response);

    return NextResponse.json({
      success: true,
      documentId: payload.data.documentId,
      jobId: payload.data.jobId,
      status: payload.data.status,
      message: payload.data.message,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Upload failed";
    const status = message.includes("quota") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  try {
    const response = await backendFetch(
      request,
      `documents?projectId=${encodeURIComponent(projectId)}`
    );
    const payload = await parseBackendJson(response);
    const documents = mapBackendDocumentList(payload.data as any[]);

    return NextResponse.json({ documents });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to list documents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}