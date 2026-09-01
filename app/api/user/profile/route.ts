import { NextRequest, NextResponse } from "next/server";
import { backendFetch, parseBackendJson } from "@/lib/backend-client";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await backendFetch(request, "user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await parseBackendJson(response);
    return NextResponse.json({ success: true, data: payload.data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
