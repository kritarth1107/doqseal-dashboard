import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch, parseBackendJson } from "@/lib/backend-client";

async function requireSession() {
  const cookieStore = await cookies();
  return cookieStore.get("session_token")?.value ?? null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const sessionToken = await requireSession();
  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await params;

  try {
    const response = await backendFetch(request, `invites/${token}/accept`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    const payload = await parseBackendJson(response);
    return NextResponse.json({ success: true, result: payload.data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to accept invite";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
