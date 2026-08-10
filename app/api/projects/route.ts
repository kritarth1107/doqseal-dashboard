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
    const response = await backendFetch(request, "projects");
    const payload = await parseBackendJson(response);
    return NextResponse.json({ success: true, projects: payload.data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load projects";
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
    const response = await backendFetch(request, "projects", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const payload = await parseBackendJson(response);
    return NextResponse.json({ success: true, project: payload.data }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create project";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}