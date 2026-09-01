import { NextResponse } from "next/server";
import { getHeadersFromRequest } from "@/lib/header-utils";
import { backendUrl } from "@/lib/backend-client";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ fingerprint: string }> }
) {
  const { fingerprint } = await params;
  try {
    const headers = getHeadersFromRequest(request);
    const response = await fetch(
      backendUrl(`user/sessions/${encodeURIComponent(fingerprint)}`),
      { method: "DELETE", headers }
    );
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to revoke session" },
        { status: response.status }
      );
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
