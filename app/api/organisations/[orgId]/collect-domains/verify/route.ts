import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch, parseBackendJson } from "@/lib/backend-client";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { orgId } = await context.params;
  try {
    const body = await request.json();
    const response = await backendFetch(
      request,
      `organisations/${orgId}/collect-domains/verify`,
      { method: "POST", body: JSON.stringify(body) }
    );
    const payload = await parseBackendJson<{ data: unknown }>(response);
    return NextResponse.json({ success: true, data: payload.data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
