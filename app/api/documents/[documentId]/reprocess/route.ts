import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch, parseBackendJson } from "@/lib/backend-client";

async function requireSession() {
  const cookieStore = await cookies();
  return cookieStore.get("session_token")?.value ?? null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;

  try {
    const response = await backendFetch(
      request,
      `documents/${documentId}/reprocess`,
      { method: "POST" }
    );
    const payload = await parseBackendJson(response);
    return NextResponse.json({ success: true, ...(payload.data || {}) });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to reprocess document";
    const status = /quota|exceeded/i.test(message) ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
