import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch, parseBackendJson } from "@/lib/backend-client";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

async function requireSession() {
  const cookieStore = await cookies();
  return cookieStore.get("session_token")?.value ?? null;
}

/** Org-level / Drive upload (project optional). */
export async function POST(request: NextRequest) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
      return NextResponse.json(
        { error: "Consent is required before upload" },
        { status: 400 }
      );
    }

    const projectIdRaw = formData.get("projectId");
    const projectId =
      typeof projectIdRaw === "string" && projectIdRaw.trim()
        ? projectIdRaw.trim()
        : null;

    const sharedRaw = formData.get("sharedWithOrganisation");
    const sharedWithOrganisation =
      sharedRaw === "true" || sharedRaw === "1";

    const backendForm = new FormData();
    backendForm.append("file", file);
    backendForm.append("consent", "true");
    backendForm.append(
      "sharedWithOrganisation",
      sharedWithOrganisation ? "true" : "false"
    );
    if (projectId) {
      backendForm.append("projectId", projectId);
    }

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
      projectId?: string | null;
      sharedWithOrganisation?: boolean;
    }>(response);

    return NextResponse.json({
      success: true,
      documentId: payload.data.documentId,
      jobId: payload.data.jobId,
      status: payload.data.status,
      projectId: payload.data.projectId ?? projectId,
      sharedWithOrganisation:
        payload.data.sharedWithOrganisation ?? sharedWithOrganisation,
      message: payload.data.message,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Upload failed";
    const status = message.includes("quota") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
