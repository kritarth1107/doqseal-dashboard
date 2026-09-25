import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch, parseBackendJson } from "@/lib/backend-client";

async function requireSession() {
  const cookieStore = await cookies();
  return cookieStore.get("session_token")?.value ?? null;
}

export interface ConversationMessage {
  messageId: string;
  role: "user" | "assistant";
  content: string;
  citations?: Array<{
    n: number;
    documentId: string;
    title: string;
    page: number | null;
    quote: string;
  }>;
  mode?: string;
  steps?: Array<{
    id: string;
    name: string;
    label: string;
    detail?: Record<string, unknown>;
  }>;
  createdAt: string;
}

export interface ConversationDetail {
  conversationId: string;
  title: string;
  projectId?: string | null;
  createdAt: string;
  updatedAt: string;
  messages: ConversationMessage[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await params;

  try {
    const response = await backendFetch(
      request,
      `chat/conversations/${encodeURIComponent(conversationId)}`,
      { method: "GET" }
    );

    const payload = await parseBackendJson<ConversationDetail>(response);

    return NextResponse.json({
      success: true,
      conversation: payload.data,
    });
  } catch (error) {
    console.error("[Conversations] get error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get conversation" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await params;

  let body: { title?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  try {
    const response = await backendFetch(
      request,
      `chat/conversations/${encodeURIComponent(conversationId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ title: body.title.trim() }),
      }
    );

    const payload = await parseBackendJson<ConversationDetail>(response);

    return NextResponse.json({
      success: true,
      conversation: payload.data,
    });
  } catch (error) {
    console.error("[Conversations] rename error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to rename conversation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await params;

  try {
    const response = await backendFetch(
      request,
      `chat/conversations/${encodeURIComponent(conversationId)}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Failed to delete conversation");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Conversations] delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete conversation" },
      { status: 500 }
    );
  }
}
