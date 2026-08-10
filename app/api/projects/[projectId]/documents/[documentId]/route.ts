import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch, parseBackendJson } from "@/lib/backend-client";
import { mapBackendDocument } from "@/lib/document-api";

async function requireSession() {
  const cookieStore = await cookies();
  return cookieStore.get("session_token")?.value ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; documentId: string }> }
) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, documentId } = await params;

  try {
    const response = await backendFetch(request, `documents/${documentId}`);
    const payload = await parseBackendJson(response);
    const doc = mapBackendDocument(payload.data as any);

    if (doc.projectId !== projectId) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json(doc);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load document";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; documentId: string }> }
) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;

  try {
    const response = await backendFetch(request, `documents/${documentId}`, {
      method: "DELETE",
    });
    await parseBackendJson(response);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}