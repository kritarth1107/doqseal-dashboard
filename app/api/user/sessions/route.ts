import { NextResponse } from "next/server";
import { getHeadersFromRequest } from "@/lib/header-utils";
import { backendUrl } from "@/lib/backend-client";

export async function GET(request: Request) {
  try {
    const headers = getHeadersFromRequest(request);
    const response = await fetch(backendUrl("user/sessions"), {
      method: "GET",
      headers,
    });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to fetch sessions" },
        { status: response.status }
      );
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
