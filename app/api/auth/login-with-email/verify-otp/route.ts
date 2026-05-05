import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { otp, token, name, email } = await request.json();

    if (!otp || !token || !email) {
      return NextResponse.json(
        { error: "OTP, Token, and Email are required" },
        { status: 400 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return NextResponse.json(
        { error: "API URL not configured" },
        { status: 500 }
      );
    }

    const { getHeadersFromRequest } = await import("@/lib/header-utils");
    const headers = getHeadersFromRequest(request);

    const response = await fetch(`${apiUrl}kingdom/login-request/verify-otp`, {
      method: "POST",
      headers,
      body: JSON.stringify({ 
        otp, 
        token, 
        name: name || undefined, 
        email
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to verify OTP" },
        { status: response.status }
      );
    }

    // Set session cookie
    if (data.success && data.data?.token) {
      const cookieStore = await cookies();
      cookieStore.set("session_token", data.data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
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