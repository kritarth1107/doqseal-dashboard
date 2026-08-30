import { NextResponse } from "next/server";
import { getHeadersFromRequest } from "@/lib/header-utils";
import { backendUrl } from "@/lib/backend-client";

export async function POST(request: Request) {
  try {
    const headers = getHeadersFromRequest(request);

    const { name, organisationId, expiresInDays } = await request.json();

    if (!name || !organisationId) {
      return NextResponse.json(
        { error: "Name and Organisation ID are required" },
        { status: 400 }
      );
    }

    try {
      const response = await fetch(backendUrl("api-wickets"), {
        method: "POST",
        headers,
        body: JSON.stringify({
          name,
          organisationId,
          expiresInDays: expiresInDays ? Number(expiresInDays) : undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { error: data.message || "Failed to create API key" },
          { status: response.status }
        );
      }

      return NextResponse.json(data);
    } catch (backendError) {
      console.error("Backend API key creation failed:", backendError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  } catch (error) {
    console.error("API key creation error:", error);
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
  }
}
