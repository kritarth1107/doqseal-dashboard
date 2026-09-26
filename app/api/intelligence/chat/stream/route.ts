import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { backendUrl } from "@/lib/backend-client";
import { getHeadersFromRequest } from "@/lib/header-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Pass-through of the backend's grounded chat stream. Aborting the request cancels the backend call. */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  if (!cookieStore.get("session_token")?.value) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body: { message?: unknown; conversationId?: unknown; projectId?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return json({ error: "Message required" }, 400);
  }

  const payload: Record<string, string> = { message };
  if (typeof body.conversationId === "string" && body.conversationId) payload.conversationId = body.conversationId;
  if (typeof body.projectId === "string" && body.projectId) payload.projectId = body.projectId;

  let upstream: Response;
  try {
    upstream = await fetch(backendUrl("chat/stream"), {
      method: "POST",
      headers: {
        ...getHeadersFromRequest(request),
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(payload),
      signal: request.signal,
      cache: "no-store",
    });
  } catch (error) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    console.error("[Intelligence] stream proxy error:", error);
    return json({ error: "Chat is unavailable right now" }, 502);
  }

  const contentType = upstream.headers.get("content-type") || "";
  if (!upstream.ok || !contentType.includes("text/event-stream") || !upstream.body) {
    const data = await upstream.json().catch(() => ({}));
    return json({ error: data.message || data.error || "Chat is unavailable right now" }, upstream.ok ? 502 : upstream.status);
  }

  const headers: Record<string, string> = {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no",
  };
  const conversationId = upstream.headers.get("x-conversation-id");
  if (conversationId) headers["X-Conversation-Id"] = conversationId;

  return new Response(upstream.body, { status: 200, headers });
}
