import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getHeadersFromRequest } from "@/lib/header-utils";
import { backendUrl } from "@/lib/backend-client";

export async function POST(request: Request) {
  try {
    const headers = getHeadersFromRequest(request);

    try {
      await fetch(backendUrl("kingdom/logout"), {
        method: "POST",
        headers,
        body: JSON.stringify({ type: "current" }),
      });
    } catch (backendError) {
      console.error("Backend logout notification failed:", backendError);
    }

    const cookieStore = await cookies();

    cookieStore.set("session_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
