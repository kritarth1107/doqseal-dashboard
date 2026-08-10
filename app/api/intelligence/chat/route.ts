import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch, parseBackendJson } from "@/lib/backend-client";

async function requireSession() {
  const cookieStore = await cookies();
  return cookieStore.get("session_token")?.value ?? null;
}

type ChatCitation = {
  documentId?: string;
  projectId?: string;
  snippet?: string;
};

export async function POST(request: NextRequest) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const projectId = body.projectId ? String(body.projectId) : undefined;
    const messages = (body.messages ?? []) as Array<{
      role: string;
      content: string;
    }>;

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

    const response = await backendFetch(request, "chat", {
      method: "POST",
      body: JSON.stringify({
        message: last.content.trim(),
        projectId,
      }),
    });

    const payload = await parseBackendJson<{
      answer: string;
      citations: ChatCitation[];
      mode: string;
    }>(response);

    const documents = (payload.data.citations ?? [])
      .filter((c) => c.documentId)
      .map((c) => ({
        id: c.documentId as string,
        patientName: "Referenced document",
        filename: c.snippet?.slice(0, 80) || c.documentId || "Document",
        status: "indexed",
        href: c.projectId
          ? `/projects/${c.projectId}/documents/${c.documentId}`
          : `/projects`,
      }));

    return NextResponse.json({
      reply: payload.data.answer,
      documents,
      mode: payload.data.mode,
    });
  } catch (error: unknown) {
    console.error("[Intelligence] chat error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chat failed" },
      { status: 500 }
    );
  }
}
