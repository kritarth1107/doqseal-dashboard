import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch } from "@/lib/backend-client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  if (!cookieStore.get("session_token")?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limit = request.nextUrl.searchParams.get("limit");
  const before = request.nextUrl.searchParams.get("before");
  const query = new URLSearchParams();
  if (limit && /^\d+$/.test(limit)) query.set("limit", limit);
  if (before) query.set("before", before);

  try {
    const response = await backendFetch(request, `chat/conversations${query.toString() ? `?${query.toString()}` : ""}`, { method: "GET" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json({ conversations: [], error: data.message || "Conversations unavailable" }, { status: response.status });
    }
    return NextResponse.json({ conversations: data.data?.conversations ?? [] });
  } catch (error) {
    console.error("[Intelligence] conversations error:", error);
    return NextResponse.json({ conversations: [], error: "Conversations unavailable" }, { status: 502 });
  }
}
