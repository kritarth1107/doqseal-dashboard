import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch, parseBackendJson } from "@/lib/backend-client";

async function requireSession() {
  const cookieStore = await cookies();
  return cookieStore.get("session_token")?.value ?? null;
}

type TimelineEvent = {
  action: string;
  actorId: string;
  actor?: {
    userId: string;
    name: string;
    email?: string | null;
    avatar?: string | null;
    isSystem?: boolean;
  } | null;
  resourceType: string;
  metadata?: Record<string, unknown> | null;
  timestamp: string;
};

type OrgMember = {
  userId: string;
  name?: string;
  email?: string | null;
  avatar?: string | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;
  const orgId = request.headers.get("x-organisation-id");

  try {
    const response = await backendFetch(
      request,
      `documents/${documentId}/timeline`
    );
    const payload = await parseBackendJson(response);
    let events = (
      Array.isArray(payload.data) ? payload.data : []
    ) as TimelineEvent[];

    const needsEnrichment = events.some(
      (e) =>
        e.actorId &&
        !String(e.actorId).startsWith("system:") &&
        !e.actor?.name
    );

    if (needsEnrichment && orgId) {
      try {
        const orgRes = await backendFetch(request, `organisations/${orgId}`);
        const orgPayload = await parseBackendJson<{ members?: OrgMember[] }>(
          orgRes
        );
        const members = Array.isArray(orgPayload.data?.members)
          ? orgPayload.data.members
          : [];
        const byId = new Map(members.map((m) => [m.userId, m]));

        events = events.map((event) => {
          if (event.actor?.name) return event;
          if (String(event.actorId || "").startsWith("system:")) {
            return {
              ...event,
              actor: {
                userId: event.actorId,
                name:
                  event.actorId === "system:webhook" ? "Webhook" : "System",
                email: null,
                avatar: null,
                isSystem: true,
              },
            };
          }
          const member = byId.get(event.actorId);
          if (!member?.name) return event;
          return {
            ...event,
            actor: {
              userId: member.userId,
              name: member.name,
              email: member.email || null,
              avatar: member.avatar || null,
              isSystem: false,
            },
          };
        });
      } catch {
        // keep raw events
      }
    }

    return NextResponse.json({ success: true, events });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load timeline";
    const status = message.toLowerCase().includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
