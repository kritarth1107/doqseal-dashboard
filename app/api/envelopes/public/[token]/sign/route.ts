import { NextRequest, NextResponse } from "next/server";
import { backendFetch, parseBackendJson } from "@/lib/backend-client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const body = await request.json();
    const response = await backendFetch(request, `envelopes/public/${token}/sign`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const payload = await parseBackendJson(response);
    return NextResponse.json({ success: true, result: payload.data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to sign envelope";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
