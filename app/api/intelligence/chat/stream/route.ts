import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { backendUrl } from "@/lib/backend-client";
import { getHeadersFromRequest } from "@/lib/header-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireSession() {
  const cookieStore = await cookies();
  return cookieStore.get("session_token")?.value ?? null;
}

export async function POST(request: NextRequest) {
  const token = await requireSession();
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { message?: string; conversationId?: string; projectId?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { message, conversationId, projectId } = body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return new Response(JSON.stringify({ error: "Message required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const headers = getHeadersFromRequest(request);
  delete (headers as Record<string, string>)["Content-Type"];

  const backendPayload = {
    message: message.trim(),
    ...(conversationId && { conversationId }),
    ...(projectId && { projectId }),
  };

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(backendUrl("chat/stream"), {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(backendPayload),
    });
  } catch (error) {
    console.error("[Intelligence] stream proxy error:", error);
    return new Response(JSON.stringify({ error: "Failed to connect to backend" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!upstreamResponse.ok) {
    const contentType = upstreamResponse.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const errorData = await upstreamResponse.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ error: errorData.message || "Backend error" }),
        {
          status: upstreamResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    return new Response(
      JSON.stringify({ error: `Backend returned ${upstreamResponse.status}` }),
      {
        status: upstreamResponse.status,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (!upstreamResponse.body) {
    return new Response(JSON.stringify({ error: "No response body from backend" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(upstreamResponse.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
