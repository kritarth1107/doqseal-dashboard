import { NextRequest, NextResponse } from "next/server";
import { backendUrl } from "@/lib/backend-client";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slugOrToken: string }> }
) {
  const { slugOrToken } = await context.params;
  try {
    const formData = await request.formData();
    const response = await fetch(
      backendUrl(
        `request-links/public/${encodeURIComponent(slugOrToken)}/submit`
      ),
      {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      }
    );
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || data.error || "Submit failed" },
        { status: response.status }
      );
    }
    return NextResponse.json({ success: true, data: data.data }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
