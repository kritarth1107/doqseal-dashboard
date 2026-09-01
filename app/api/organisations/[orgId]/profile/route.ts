import { NextRequest, NextResponse } from "next/server";
import { backendFetch, parseBackendJson } from "@/lib/backend-client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  try {
    const body = await request.json();
    const response = await backendFetch(request, `organisations/${orgId}/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await parseBackendJson(response);
    return NextResponse.json({ success: true, organisation: payload.data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update organisation";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
