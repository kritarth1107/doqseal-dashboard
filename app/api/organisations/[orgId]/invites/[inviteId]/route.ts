import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch, parseBackendJson } from "@/lib/backend-client";

async function requireSession() {
  const cookieStore = await cookies();
  return cookieStore.get("session_token")?.value ?? null;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; inviteId: string }> }
) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orgId, inviteId } = await params;

  try {
    const response = await backendFetch(
      request,
      `organisations/${orgId}/invites/${inviteId}`,
      { method: "DELETE" }
    );
    const payload = await parseBackendJson(response);
    return NextResponse.json({ success: true, result: payload.data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to revoke invite";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
