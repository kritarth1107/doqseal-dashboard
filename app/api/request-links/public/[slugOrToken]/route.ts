import { NextRequest, NextResponse } from "next/server";
import { backendUrl } from "@/lib/backend-client";

/** Public — no session required */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slugOrToken: string }> }
) {
  const { slugOrToken } = await context.params;
  try {
    const response = await fetch(
      backendUrl(`request-links/public/${encodeURIComponent(slugOrToken)}`),
      { headers: { Accept: "application/json" }, cache: "no-store" }
    );
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || data.error || "Unavailable" },
        { status: response.status }
      );
    }
    return NextResponse.json({ success: true, data: data.data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
