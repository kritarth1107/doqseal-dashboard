import { NextRequest, NextResponse } from "next/server";
import { backendUrl } from "@/lib/backend-client";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slugOrToken: string }> }
) {
  const { slugOrToken } = await context.params;
  try {
    const body = await request.json();
    const response = await fetch(
      backendUrl(
        `request-links/public/${encodeURIComponent(slugOrToken)}/otp/request`
      ),
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || data.error || "OTP failed" },
        { status: response.status }
      );
    }
    return NextResponse.json({ success: true, data: data.data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
