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
    const response = await backendFetch(request, "request-links");
    const payload = await parseBackendJson<{ data: unknown }>(response);
    return NextResponse.json({ success: true, data: payload.data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to list";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const response = await backendFetch(request, "request-links", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const payload = await parseBackendJson<{ data: unknown }>(response);
    return NextResponse.json({ success: true, data: payload.data }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
