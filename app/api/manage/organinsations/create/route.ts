import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getHeadersFromRequest } from "@/lib/header-utils";

export async function POST(request: Request) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const headers = getHeadersFromRequest(request);

    const { name, website, logoUrl } = await request.json();

    if (!name || !website) {
      return NextResponse.json(
        { error: "Name and Website are required" },
        { status: 400 }
      );
    }

    // 1. Notify backend to create the API key
    try {
      const response = await fetch(`${apiUrl}user/organisations`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name,
          website,
          logoUrl
        }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        return NextResponse.json({ error: data.message || "Failed to create Organisation" }, { status: response.status });
      }

      return NextResponse.json(data);
    } catch (backendError) {
      console.error("Backend Organisation creation failed:", backendError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
    } catch (error) {
    console.error("Organisation creation error:", error);
    return NextResponse.json({ error: "Failed to create Organisation" }, { status: 500 });
  }
}
