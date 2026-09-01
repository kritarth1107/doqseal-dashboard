import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch, parseBackendJson } from "@/lib/backend-client";

async function requireSession() {
  const cookieStore = await cookies();
  return cookieStore.get("session_token")?.value ?? null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orgId } = await params;

  try {
    const body = await request.json();
    const response = await backendFetch(
      request,
      `organisations/${orgId}/domain/settings`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      }
    );
    const payload = await parseBackendJson(response);
    return NextResponse.json({ success: true, domain: payload.data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update domain settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
