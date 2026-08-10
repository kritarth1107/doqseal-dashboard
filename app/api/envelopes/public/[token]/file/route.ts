import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const response = await backendFetch(request, `envelopes/public/${token}/file`);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.message || "File not found" },
        { status: response.status }
      );
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "application/pdf";

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
