import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ChatMessage,
  generateProjectChatReply,
} from "@/lib/project-chat";
import { projects } from "@/lib/mock-data";
import { supportsProjectUpload } from "@/lib/project-config";

async function requireSession() {
  const cookieStore = await cookies();
  return cookieStore.get("session_token")?.value ?? null;
}

export async function POST(request: NextRequest) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const projectId = String(body.projectId ?? "p-test-request");
    const messages = (body.messages ?? []) as ChatMessage[];

    if (!supportsProjectUpload(projectId) && !projects.some((p) => p.id === projectId)) {
      return NextResponse.json({ error: "Unknown project" }, { status: 400 });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages required" }, { status: 400 });
    }

    const last = messages[messages.length - 1];
    if (last.role !== "user" || !String(last.content).trim()) {
      return NextResponse.json(
        { error: "Last message must be from user" },
        { status: 400 }
      );
    }

    const result = await generateProjectChatReply(projectId, messages);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[Intelligence] chat error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chat failed" },
      { status: 500 }
    );
  }
}
