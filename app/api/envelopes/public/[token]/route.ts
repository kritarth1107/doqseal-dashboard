import { NextRequest, NextResponse } from "next/server";
import { backendFetch, parseBackendJson } from "@/lib/backend-client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const response = await backendFetch(request, `envelopes/public/${token}`);
    const payload = await parseBackendJson(response);
    return NextResponse.json({ success: true, envelope: payload.data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load signing session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
