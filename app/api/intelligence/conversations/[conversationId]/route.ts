import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch } from "@/lib/backend-client";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ conversationId: string }> };

async function proxy(request: NextRequest, params: Params["params"], init: RequestInit) {
  const cookieStore = await cookies();
  if (!cookieStore.get("session_token")?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { conversationId } = await params;
  if (!conversationId || conversationId.length > 100) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }
  try {
    const response = await backendFetch(request, `chat/conversations/${encodeURIComponent(conversationId)}`, init);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json({ error: data.message || "Request failed" }, { status: response.status });
    }
    return NextResponse.json(data.data ?? {});
  } catch (error) {
    console.error("[Intelligence] conversation error:", error);
    return NextResponse.json({ error: "Conversations unavailable" }, { status: 502 });
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  return proxy(request, params, { method: "GET" });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title : "";
  return proxy(request, params, { method: "PATCH", body: JSON.stringify({ title }) });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  return proxy(request, params, { method: "DELETE" });
}
