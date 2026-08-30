"use client";

export type StoredChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  documents?: {
    id: string;
    patientName: string;
    filename: string;
    status: string;
    href: string;
  }[];
};

export type StoredChatSession = {
  id: string;
  title: string;
  preview?: string;
  updatedAt: string;
  projectId?: string;
  messages: StoredChatMessage[];
};

function storageKey(orgId: string) {
  return `doqseal.chat.history.${orgId}`;
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
