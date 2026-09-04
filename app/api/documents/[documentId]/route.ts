import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch, parseBackendJson } from "@/lib/backend-client";
import { mapBackendDocument } from "@/lib/document-api";
import type { StoredDocument } from "@/types/extraction";

async function requireSession() {
  const cookieStore = await cookies();
  return cookieStore.get("session_token")?.value ?? null;
}

type OrgMember = {
  userId: string;
  name?: string;
  email?: string | null;
  avatar?: string | null;
};

async function enrichDocumentDetails(
  request: NextRequest,
  doc: StoredDocument,
  orgId: string | null
): Promise<StoredDocument> {
  const needsProject = Boolean(doc.projectId && !doc.projectName);
  const needsUploader = Boolean(doc.uploadedBy && !doc.uploadedByUser?.name);

  if (!needsProject && !needsUploader) return doc;

  const tasks: Promise<void>[] = [];
  let next: StoredDocument = { ...doc };

  if (needsProject && doc.projectId) {
    tasks.push(
      (async () => {
        try {
          const res = await backendFetch(request, `projects/${doc.projectId}`);
          const payload = await parseBackendJson<{ name?: string }>(res);
          const name =
            payload.data &&
            typeof payload.data === "object" &&
            "name" in payload.data
              ? String((payload.data as { name?: string }).name || "")
              : "";
          if (name) {
            next = { ...next, projectName: name };
          }
        } catch {
          // keep fallback
        }
      })()
    );
  }

  if (needsUploader && doc.uploadedBy && orgId) {
    tasks.push(
      (async () => {
        try {
          const res = await backendFetch(request, `organisations/${orgId}`);
          const payload = await parseBackendJson<{
            members?: OrgMember[];
            organisationId?: string;
          }>(res);
          const members = Array.isArray(payload.data?.members)
            ? payload.data.members
            : [];
          const member = members.find((m) => m.userId === doc.uploadedBy);
          if (member?.name) {
            next = {
              ...next,
              organisationId: next.organisationId || orgId,
              uploadedByUser: {
                userId: member.userId,
                name: member.name,
                email: member.email || null,
                avatar: member.avatar || null,
              },
            };
          }
        } catch {
          // keep fallback
        }
      })()
    );
  } else if (!next.organisationId && orgId) {
    next = { ...next, organisationId: orgId };
  }

  await Promise.all(tasks);
  return next;
}

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
    const response = await backendFetch(request, `documents/${documentId}`);
    const payload = await parseBackendJson(response);
    let doc = mapBackendDocument(payload.data as never);
    doc = await enrichDocumentDetails(request, doc, orgId);
    return NextResponse.json(doc);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load document";
    const status = message.toLowerCase().includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;

  try {
    const response = await backendFetch(request, `documents/${documentId}`, {
      method: "DELETE",
    });
    const payload = await parseBackendJson(response);
    return NextResponse.json({ success: true, ...(payload.data || {}) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
