import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  createDocument,
  ensureUploadDir,
  getProjectDocuments,
  resolveUploadPath,
} from "@/lib/document-store";
import { processDocumentRecord } from "@/lib/document-processing";
import { supportsProjectUpload } from "@/lib/project-config";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

async function requireSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;
  return token;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  if (!supportsProjectUpload(projectId)) {
    return NextResponse.json({ error: "Upload not enabled for this project" }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 400 });
    }

    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PDF, PNG, and JPG files are allowed" },
        { status: 400 }
      );
    }

    await ensureUploadDir();

    const ext = path.extname(file.name) || ".pdf";
    const storedFilename = `${randomUUID()}${ext}`;
    const filePath = resolveUploadPath(storedFilename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const doc = await createDocument({
      projectId,
      originalFilename: file.name,
      storedFilename,
      mimeType: file.type,
      size: file.size,
    });

    void processDocumentRecord(doc.id).catch((error) => {
      console.error(`[Upload] Demo processing failed for ${file.name}:`, error);
    });

    return NextResponse.json({
      success: true,
      documentId: doc.id,
      status: "processing",
      message: "File uploaded. Extraction started.",
    });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const token = await requireSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const documents = await getProjectDocuments(projectId);
  return NextResponse.json({ documents });
}
