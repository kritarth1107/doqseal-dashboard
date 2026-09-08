import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch, parseBackendJson } from "@/lib/backend-client";

async function requireSession() {
  const cookieStore = await cookies();
  return cookieStore.get("session_token")?.value ?? null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ requestLinkId: string }> }
) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { requestLinkId } = await context.params;
  try {
    const response = await backendFetch(request, `request-links/${requestLinkId}`);
    const payload = await parseBackendJson<{ data: unknown }>(response);
    return NextResponse.json({ success: true, data: payload.data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ requestLinkId: string }> }
) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { requestLinkId } = await context.params;
  try {
    const body = await request.json();
    const response = await backendFetch(request, `request-links/${requestLinkId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    const payload = await parseBackendJson<{ data: unknown }>(response);
    return NextResponse.json({ success: true, data: payload.data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
