import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch } from "@/lib/backend-client";

async function requireSession() {
  const cookieStore = await cookies();
  return cookieStore.get("session_token")?.value ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;

  try {
    const response = await backendFetch(request, `documents/${documentId}/file`);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.message || "File not found" },
        { status: response.status }
      );
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}