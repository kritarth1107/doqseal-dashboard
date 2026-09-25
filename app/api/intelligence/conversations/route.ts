import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch, parseBackendJson } from "@/lib/backend-client";

async function requireSession() {
  const cookieStore = await cookies();
  return cookieStore.get("session_token")?.value ?? null;
}

export interface ConversationSummary {
  conversationId: string;
  title: string;
  projectId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function GET(request: NextRequest) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await backendFetch(request, "chat/conversations", {
      method: "GET",
    });

    const payload = await parseBackendJson<{
      conversations: ConversationSummary[];
    }>(response);

    return NextResponse.json({
      success: true,
      conversations: payload.data.conversations ?? [],
    });
  } catch (error) {
    console.error("[Conversations] list error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list conversations" },
      { status: 500 }
    );
  }
}
