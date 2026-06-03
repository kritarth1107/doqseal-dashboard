import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { StoredDocument } from "@/types/extraction";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "documents.json");
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

type DocumentStore = Record<string, StoredDocument>;

async function ensureStore(): Promise<DocumentStore> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    return JSON.parse(raw) as DocumentStore;
  } catch {
    return {};
  }
}

async function writeStore(store: DocumentStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2));
}

export function getUploadDir(): string {
  return UPLOAD_DIR;
}

export function resolveUploadPath(storedFilename: string): string {
  return path.join(getUploadDir(), storedFilename);
}

export async function createDocument(input: {
  projectId: string;
  originalFilename: string;
  storedFilename: string;
  mimeType: string;
  size: number;
}): Promise<StoredDocument> {
  const store = await ensureStore();
  const id = randomUUID();
  const doc: StoredDocument = {
    id,
    projectId: input.projectId,
    originalFilename: input.originalFilename,
    storedFilename: input.storedFilename,
    mimeType: input.mimeType,
    size: input.size,
    status: "processing",
    extractedJson: null,
    confidence: 0,
    extractionStrategy: "demo",
    uploadedAt: new Date().toISOString(),
  };
  store[id] = doc;
  await writeStore(store);
  return doc;
}

export async function getDocument(id: string): Promise<StoredDocument | null> {
  const store = await ensureStore();
  return store[id] ?? null;
}

export async function getProjectDocuments(projectId: string): Promise<StoredDocument[]> {
  const store = await ensureStore();
  return Object.values(store)
    .filter((doc) => doc.projectId === projectId)
    .sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
}

export async function updateDocument(
  id: string,
  patch: Partial<StoredDocument>
): Promise<StoredDocument | null> {
  const store = await ensureStore();
  const existing = store[id];
  if (!existing) return null;
  const updated = { ...existing, ...patch, id: existing.id };
  store[id] = updated;
  await writeStore(store);
  return updated;
}

export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(getUploadDir(), { recursive: true });
}

export async function deleteDocument(id: string): Promise<boolean> {
  const store = await ensureStore();
  const doc = store[id];
  if (!doc) return false;

  try {
    await fs.unlink(resolveUploadPath(doc.storedFilename));
  } catch {
    // File may already be missing
  }

  delete store[id];
  await writeStore(store);
  return true;
}
