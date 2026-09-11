import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendUrl } from "@/lib/backend-client";

export async function POST(request: NextRequest) {
  try {
    const { otp, token, name, email } = await request.json();

    if (!otp || !token || !email) {
      return NextResponse.json(
        { error: "OTP, Token, and Email are required" },
        { status: 400 }
      );
    }

    const { getHeadersFromRequest } = await import("@/lib/header-utils");
    const headers = getHeadersFromRequest(request);

    const response = await fetch(backendUrl("kingdom/login-request/verify-otp"), {
      method: "POST",
      headers,
      body: JSON.stringify({
        otp,
        token,
        name: name || undefined,
        email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to verify OTP" },
        { status: response.status }
      );
    }

    if (data.success && data.data?.token) {
      const { SESSION_COOKIE_OPTIONS } = await import("@/lib/session-cookie");
      const cookieStore = await cookies();
      cookieStore.set("session_token", data.data.token, SESSION_COOKIE_OPTIONS);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in verify-otp route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
