import { NextResponse } from "next/server";
import { getHeadersFromRequest } from "@/lib/header-utils";
import { backendUrl } from "@/lib/backend-client";

export async function DELETE(request: Request) {
  try {
    const { organisationId, keyId } = await request.json();

    if (!organisationId || !keyId) {
      return NextResponse.json(
        { error: "Organisation ID and key ID are required" },
        { status: 400 }
      );
    }

    const headers = getHeadersFromRequest(request);

    const response = await fetch(
      backendUrl(`api-wickets/${organisationId}/${keyId}`),
      {
        method: "DELETE",
        headers,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to revoke API key" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API key revoke error:", error);
    return NextResponse.json(
      { error: "Internal server error while revoking key" },
      { status: 500 }
    );
  }
}
