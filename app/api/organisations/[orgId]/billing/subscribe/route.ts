import { NextRequest, NextResponse } from "next/server";
import { backendFetch, parseBackendJson } from "@/lib/backend-client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  try {
    const body = await request.json();
    const response = await backendFetch(
      request,
      `organisations/${orgId}/billing/subscribe`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    const payload = await parseBackendJson(response);
    return NextResponse.json({ success: true, ...(payload.data as object) });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to start checkout";
    const status = /required|valid|configured|Only/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
