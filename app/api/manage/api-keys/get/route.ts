import { NextResponse } from "next/server";
import { getHeadersFromRequest } from "@/lib/header-utils";

/**
 * GET /api/manage/api-keys/get
 * Proxies request to backend to retrieve all API keys for an organisation.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organisationId = searchParams.get("organisationId");

    if (!organisationId) {
      return NextResponse.json(
        { error: "Organisation ID is required" },
        { status: 400 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const headers = getHeadersFromRequest(request);

    // Fetch keys from backend api-wickets service
    const response = await fetch(`${apiUrl}api-wickets/${organisationId}`, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to fetch API keys" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API key fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching keys" },
      { status: 500 }
    );
  }
}