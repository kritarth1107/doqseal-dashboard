import { NextRequest, NextResponse } from "next/server";
import { cookies, headers as nextHeaders } from "next/headers";
import { getHeadersFromRequest } from "@/lib/header-utils";

export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return NextResponse.json(
        { error: "API URL not configured" },
        { status: 500 }
      );
    }

    // Validate session token early
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Use the utility to extract all context (token, fingerprint, user-agent, etc.)
    const headers = getHeadersFromRequest(request);

    const response = await fetch(`${apiUrl}user/me`, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to fetch user data" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in auth/me route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}