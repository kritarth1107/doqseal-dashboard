import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getHeadersFromRequest } from "@/lib/header-utils";

export async function POST(request: Request) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const headers = getHeadersFromRequest(request);

    // 1. Notify backend to revoke the session
    try {
      await fetch(`${apiUrl}kingdom/logout`, {
        method: "POST",
        headers,
        body: JSON.stringify({ type: "current" }),
      });
    } catch (backendError) {
      console.error("Backend logout notification failed:", backendError);
    }

    const cookieStore = await cookies();
    
    // 2. Clear the session_token cookie
    cookieStore.set("session_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, // Expire immediately
    });

    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
