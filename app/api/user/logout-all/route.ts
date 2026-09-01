import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getHeadersFromRequest } from "@/lib/header-utils";
import { backendUrl } from "@/lib/backend-client";

export async function POST(request: Request) {
  try {
    const headers = getHeadersFromRequest(request);
    const response = await fetch(backendUrl("user/logout-all"), {
      method: "POST",
      headers,
    });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to log out" },
        { status: response.status }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("session_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
