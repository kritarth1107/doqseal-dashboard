import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getHeadersFromRequest } from "@/lib/header-utils";
import { backendUrl } from "@/lib/backend-client";
import { SESSION_COOKIE_OPTIONS } from "@/lib/session-cookie";

/**
 * Silently rotate the access JWT while the backend sliding session is still ACTIVE.
 */
export async function POST(request: Request) {
  try {
    const headers = getHeadersFromRequest(request);
    if (!headers.Authorization) {
      return NextResponse.json(
        { success: false, message: "No session to refresh" },
        { status: 401 }
      );
    }

    const response = await fetch(backendUrl("kingdom/refresh"), {
      method: "POST",
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data?.success || !data?.data?.token) {
      return NextResponse.json(
        { success: false, message: data?.message || "Session refresh failed" },
        { status: response.status === 401 ? 401 : 400 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("session_token", data.data.token, SESSION_COOKIE_OPTIONS);

    return NextResponse.json({
      success: true,
      message: "Session refreshed",
    });
  } catch (error) {
    console.error("Session refresh error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to refresh session" },
      { status: 500 }
    );
  }
}
