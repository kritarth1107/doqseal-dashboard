import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch, parseBackendJson } from "@/lib/backend-client";

async function requireSession() {
  const cookieStore = await cookies();
  return cookieStore.get("session_token")?.value ?? null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;

  try {
    const body = await request.json();
    const response = await backendFetch(
      request,
      `documents/${documentId}/extraction`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    const payload = await parseBackendJson(response);
    return NextResponse.json({ success: true, ...(payload.data || {}) });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update extraction";
    const status = /not found/i.test(message)
      ? 404
      : /required/i.test(message)
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
