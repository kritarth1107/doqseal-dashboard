import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch, parseBackendJson } from "@/lib/backend-client";

async function requireSession() {
  const cookieStore = await cookies();
  return cookieStore.get("session_token")?.value ?? null;
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
    const response = await backendFetch(request, `projects/${projectId}`);
    const payload = await parseBackendJson(response);
    return NextResponse.json({ success: true, project: payload.data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load project";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  try {
    const body = await request.json();
    const response = await backendFetch(request, `projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: typeof body.name === "string" ? body.name : undefined,
        description:
          typeof body.description === "string" ? body.description : undefined,
        extractionHint:
          typeof body.extractionHint === "string"
            ? body.extractionHint
            : undefined,
        webhooks: Array.isArray(body.webhooks) ? body.webhooks : undefined,
        webhookUrls: Array.isArray(body.webhookUrls)
          ? body.webhookUrls.filter((u: unknown) => typeof u === "string")
          : undefined,
        sharedWithOrganisation:
          typeof body.sharedWithOrganisation === "boolean"
            ? body.sharedWithOrganisation
            : undefined,
        status:
          body.status === "active" || body.status === "archived"
            ? body.status
            : undefined,
        deleteProject:
          typeof body.deleteProject === "boolean"
            ? body.deleteProject
            : undefined,
      }),
    });
    const payload = await parseBackendJson(response);
    return NextResponse.json({ success: true, project: payload.data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update project";
    const status =
      message.includes("Invalid") ||
      message.includes("must be") ||
      message.includes("Only one") ||
      message.includes("Select at least") ||
      message.includes("Maximum")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
