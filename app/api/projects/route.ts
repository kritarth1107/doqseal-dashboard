import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch, parseBackendJson } from "@/lib/backend-client";

async function requireSession() {
  const cookieStore = await cookies();
  return cookieStore.get("session_token")?.value ?? null;
}

export async function GET(request: NextRequest) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await backendFetch(request, "projects");
    const payload = await parseBackendJson(response);
    return NextResponse.json({ success: true, projects: payload.data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load projects";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const organisationId =
      request.headers.get("x-organisation-id") ||
      (typeof body.organisationId === "string" ? body.organisationId : undefined);

    if (!organisationId) {
      return NextResponse.json(
        { error: "Organisation context required" },
        { status: 400 }
      );
    }

    if (!body?.name || String(body.name).trim().length < 2) {
      return NextResponse.json(
        { error: "Project name must be at least 2 characters" },
        { status: 400 }
      );
    }

    const response = await backendFetch(request, "projects", {
      method: "POST",
      body: JSON.stringify({
        name: String(body.name).trim(),
        description: body.description || undefined,
        extractionHint: body.extractionHint || undefined,
        webhooks: Array.isArray(body.webhooks) ? body.webhooks : undefined,
        webhookUrls: Array.isArray(body.webhookUrls)
          ? body.webhookUrls.filter((u: unknown) => typeof u === "string")
          : undefined,
        organisationId,
        sharedWithOrganisation:
          typeof body.sharedWithOrganisation === "boolean"
            ? body.sharedWithOrganisation
            : true,
      }),
    });
    const payload = await parseBackendJson(response);
    return NextResponse.json({ success: true, project: payload.data }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create project";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}