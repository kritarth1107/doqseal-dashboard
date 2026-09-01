import { NextRequest, NextResponse } from "next/server";
import { backendFetch, parseBackendJson } from "@/lib/backend-client";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const response = await backendFetch(request, "user/avatar", {
      method: "POST",
      body: formData,
    });
    const payload = await parseBackendJson(response);
    return NextResponse.json({ success: true, ...(payload.data as object) });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to upload avatar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
