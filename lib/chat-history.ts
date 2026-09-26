"use client";

import type { CitationEvent, StepEvent } from "./sse-parser";

export type StoredCitation = {
  n: number;
  documentId: string;
  title: string;
  page: number | null;
  quote: string;
};

export type StoredStep = {
  id: string;
  name: string;
  label: string;
  status?: string;
  detail?: Record<string, unknown>;
};

export type StoredChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: StoredCitation[];
  documents?: {
    id: string;
    patientName: string;
    filename: string;
    kind?: string;
    fileName?: string;
    status: string;
    href: string;
  }[];
  thinking?: {
    title: string;
    detail?: string;
  }[];
  steps?: StoredStep[];
  mode?: string;
};

export type StoredChatSession = {
  id: string;
  title: string;
  preview?: string;
  updatedAt: string;
  projectId?: string;
  messages: StoredChatMessage[];
};

const CHAT_STORAGE_PREFIX = "doqseal.chat.history.";
const MIGRATION_KEY = "doqseal.chat.migrated.v2";

function storageKey(orgId: string) {
  return `${CHAT_STORAGE_PREFIX}${orgId}`;
}

export function loadChatSessions(orgId: string): StoredChatSession[] {
  if (typeof window === "undefined" || !orgId) return [];
  try {
    const raw = localStorage.getItem(storageKey(orgId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveChatSessions(orgId: string, sessions: StoredChatSession[]) {
  if (typeof window === "undefined" || !orgId) return;
  try {
    localStorage.setItem(storageKey(orgId), JSON.stringify(sessions.slice(0, 50)));
  } catch {
    // ignore quota errors
  }
}

export function titleFromMessages(messages: StoredChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser?.content?.trim()) return "New chat";
  const text = firstUser.content.trim().replace(/\s+/g, " ");
  return text.length > 48 ? `${text.slice(0, 47)}…` : text;
}

/**
 * Purges all DoqSeal chat localStorage keys.
 * Called on logout and when server-side conversations are enabled.
 */
export function purgeChatLocalStorage(): void {
  if (typeof window === "undefined") return;
  
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CHAT_STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  });
}

/**
 * Checks if migration from localStorage to server-side has been done.
 */
export function isChatMigrated(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(MIGRATION_KEY) === "true";
}

/**
 * Marks chat as migrated to server-side storage.
 */
export function markChatMigrated(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MIGRATION_KEY, "true");
    purgeChatLocalStorage();
  } catch {
    // ignore
  }
}

/**
 * Get localStorage sessions for migration to server.
 */
export function getLocalStorageSessionsForMigration(orgId: string): StoredChatSession[] {
  if (isChatMigrated()) return [];
  return loadChatSessions(orgId);
}

/**
 * Convert citation events to stored citations.
 */
export function citationsFromEvents(events: CitationEvent[]): StoredCitation[] {
  return events.map((e) => ({
    n: e.n,
    documentId: e.documentId,
    title: e.title,
    page: e.page,
    quote: e.quote,
  }));
}

/**
 * Convert step events to stored steps.
 */
export function stepsFromEvents(events: StepEvent[]): StoredStep[] {
  const stepMap = new Map<string, StoredStep>();
  
  for (const event of events) {
    stepMap.set(event.id, {
      id: event.id,
      name: event.name,
      label: event.label,
      status: event.status,
      detail: event.detail as Record<string, unknown> | undefined,
    });
  }
  
  return Array.from(stepMap.values());
}

/**
 * Build document references from citations for backwards compatibility.
 */
export function documentsFromCitations(
  citations: StoredCitation[],
  projectId?: string
): StoredChatMessage["documents"] {
  const seen = new Set<string>();
  const docs: NonNullable<StoredChatMessage["documents"]> = [];

  for (const citation of citations) {
    if (seen.has(citation.documentId)) continue;
    seen.add(citation.documentId);

    docs.push({
      id: citation.documentId,
      patientName: citation.title || "Document",
      filename: citation.quote?.slice(0, 80) || "Indexed document",
      kind: undefined,
      fileName: undefined,
      status: "indexed",
      href: projectId
        ? `/projects/${projectId}/documents/${citation.documentId}`
        : `/view/${citation.documentId}`,
    });
  }

  return docs;
}
