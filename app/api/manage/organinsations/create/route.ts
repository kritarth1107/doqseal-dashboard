import { NextResponse } from "next/server";
import { getHeadersFromRequest } from "@/lib/header-utils";
import { backendUrl } from "@/lib/backend-client";

export async function POST(request: Request) {
  try {
    const headers = getHeadersFromRequest(request);

    const { name, website, logoUrl } = await request.json();

    if (!name || !website) {
      return NextResponse.json(
        { error: "Name and Website are required" },
        { status: 400 }
      );
    }

    try {
      const response = await fetch(backendUrl("user/organisations"), {
        method: "POST",
        headers,
        body: JSON.stringify({
          name,
          website,
          logoUrl,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { error: data.message || "Failed to create Organisation" },
          { status: response.status }
        );
      }

      return NextResponse.json(data);
    } catch (backendError) {
      console.error("Backend Organisation creation failed:", backendError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  } catch (error) {
    console.error("Organisation creation error:", error);
    return NextResponse.json(
      { error: "Failed to create Organisation" },
      { status: 500 }
    );
  }
}
