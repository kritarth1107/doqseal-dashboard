import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch, parseBackendJson } from "@/lib/backend-client";

async function requireSession() {
  const cookieStore = await cookies();
  return cookieStore.get("session_token")?.value ?? null;
}

export async function GET(request: NextRequest) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const query = limit ? `?limit=${encodeURIComponent(limit)}` : "";

    const response = await backendFetch(request, `documents${query}`);
    const payload = await parseBackendJson(response);
    return NextResponse.json({ success: true, documents: payload.data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load documents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
