import { NextRequest, NextResponse } from "next/server";
import { backendFetch, parseBackendJson } from "@/lib/backend-client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  try {
    const response = await backendFetch(request, `organisations/${orgId}/billing`);
    const payload = await parseBackendJson(response);
    return NextResponse.json({ success: true, billing: payload.data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load billing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
