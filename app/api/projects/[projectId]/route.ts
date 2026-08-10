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