import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getApiUrl } from "@/lib/backend-client";
import { getHeadersFromRequest } from "@/lib/header-utils";

async function requireSession() {
  const cookieStore = await cookies();
  return cookieStore.get("session_token")?.value ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orgId } = await params;
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page");
  const limit = searchParams.get("limit");

  const queryParts: string[] = [];
  if (page) queryParts.push(`page=${encodeURIComponent(page)}`);
  if (limit) queryParts.push(`limit=${encodeURIComponent(limit)}`);
  const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

  try {
    const headers = getHeadersFromRequest(request);
    const response = await fetch(
      `${getApiUrl()}organisations/${orgId}/audit-events${query}`,
      { headers }
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || "Failed to load audit events");
    }

    return NextResponse.json({
      success: true,
      events: data.data ?? [],
      pagination: data.meta ?? null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load audit events";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
