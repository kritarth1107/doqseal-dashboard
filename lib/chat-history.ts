"use client";

import type { ChatCitation, ChatStep } from "@/lib/chat-stream";

export type StoredChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
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
  steps?: ChatStep[];
  citations?: ChatCitation[];
  /** answered | partial | declined | error | aborted */
  mode?: string | null;
  streaming?: boolean;
};

export type ConversationSummary = {
  conversationId: string;
  title: string;
  projectId?: string | null;
  messageCount?: number;
  lastMessageAt?: string;
  updatedAt?: string;
};

/**
 * Chat history now lives on the server. Older builds kept it in localStorage
 * under these prefixes; purge them on logout and on load so nothing lingers
 * on shared machines.
 */
const CHAT_KEY_PREFIXES = ["doqseal.chat.", "doqseal-chat", "doqseal_chat", "chat-history", "chat_history"];

export function purgeChatLocalStorage(storage?: Storage | null): number {
  const store = storage ?? (typeof window !== "undefined" ? window.localStorage : null);
  if (!store) return 0;
  try {
    const doomed: string[] = [];
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (key && CHAT_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) doomed.push(key);
    }
    doomed.forEach((key) => store.removeItem(key));
    return doomed.length;
  } catch {
    return 0;
  }
}

function orgHeaders(orgId: string | null | undefined, json = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (orgId) headers["x-organisation-id"] = orgId;
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

/** Lists the caller's conversations; returns [] if the service is unavailable. */
export async function fetchConversations(orgId: string | null | undefined, fetchImpl: typeof fetch = fetch): Promise<ConversationSummary[]> {
  if (!orgId) return [];
  try {
    const res = await fetchImpl("/api/intelligence/conversations", { headers: orgHeaders(orgId), cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.conversations) ? data.conversations : [];
  } catch {
    return [];
  }
}

export type LoadedConversation = ConversationSummary & { messages: StoredChatMessage[] };

/** Loads one conversation; null when it does not exist (or is not yours), "error" on failure. */
export async function fetchConversation(
  orgId: string | null | undefined,
  conversationId: string,
  fetchImpl: typeof fetch = fetch
): Promise<LoadedConversation | null | "error"> {
  if (!orgId || !conversationId) return null;
  try {
    const res = await fetchImpl(`/api/intelligence/conversations/${encodeURIComponent(conversationId)}`, {
      headers: orgHeaders(orgId),
      cache: "no-store",
    });
    if (res.status === 404) return null;
    if (!res.ok) return "error";
    const data = await res.json();
    const messages: StoredChatMessage[] = (data?.messages ?? []).map(
      (m: { messageId: string; role: "user" | "assistant"; content: string; citations?: ChatCitation[]; steps?: ChatStep[]; mode?: string | null }) => ({
        id: m.messageId,
        role: m.role,
        content: m.content,
        citations: m.citations ?? [],
        steps: m.steps ?? [],
        mode: m.mode ?? null,
      })
    );
    return { ...data, messages };
  } catch {
    return "error";
  }
}

export async function deleteConversation(orgId: string | null | undefined, conversationId: string, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  if (!orgId) return false;
  try {
    const res = await fetchImpl(`/api/intelligence/conversations/${encodeURIComponent(conversationId)}`, {
      method: "DELETE",
      headers: orgHeaders(orgId),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function titleFromMessages(messages: StoredChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser?.content?.trim()) return "New chat";
  const text = firstUser.content.trim().replace(/\s+/g, " ");
  return text.length > 48 ? `${text.slice(0, 47)}…` : text;
}
