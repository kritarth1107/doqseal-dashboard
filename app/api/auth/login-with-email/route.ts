import { NextRequest, NextResponse } from "next/server";
import { backendUrl } from "@/lib/backend-client";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const { getHeadersFromRequest } = await import("@/lib/header-utils");
    const headers = getHeadersFromRequest(request);

    const response = await fetch(backendUrl("kingdom/login-request"), {
      method: "POST",
      headers,
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to request OTP" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in login-with-email route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
