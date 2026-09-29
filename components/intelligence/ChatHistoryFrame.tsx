"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChatHistorySidebar, type ChatHistoryItem } from "@/components/intelligence/ChatHistorySidebar";
import { useAuth } from "@/components/AuthProvider";
import {
  cachedConversations,
  deleteConversation,
  fetchConversations,
  rememberConversations,
  type ConversationSummary,
} from "@/lib/chat-history";

type ChatHistoryApi = {
  refresh: () => void;
  registerNewChat: (handler: () => void) => void;
};

const ChatHistoryContext = createContext<ChatHistoryApi>({
  refresh: () => {},
  registerNewChat: () => {},
});

export function useChatHistory() {
  return useContext(ChatHistoryContext);
}

function routeChatIdFrom(pathname: string) {
  if (!pathname.startsWith("/intelligence/")) return "";
  return decodeURIComponent(pathname.slice("/intelligence/".length).split("/")[0] || "");
}

function chatHref(id?: string | null, project?: string) {
  const base = id ? `/intelligence/${id}` : "/intelligence";
  return project ? `${base}?project=${encodeURIComponent(project)}` : base;
}

export function ChatHistoryFrame({ children }: { children: React.ReactNode }) {
  const { activeOrgId } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationSummary[]>(() => cachedConversations(activeOrgId));
  const [loading, setLoading] = useState(() => cachedConversations(activeOrgId).length === 0);
  const [collapsed, setCollapsed] = useState(false);
  const [projectId, setProjectId] = useState("");
  const newChat = useRef<() => void>(() => {});
  const routeChatId = routeChatIdFrom(pathname);

  useEffect(() => {
    setProjectId(new URLSearchParams(window.location.search).get("project") || "");
  }, [pathname]);

  const refresh = useCallback(async () => {
    if (!activeOrgId) return;
    const next = await fetchConversations(activeOrgId);
    const cached = cachedConversations(activeOrgId);
    setConversations(next.length === 0 && cached.length > 0 ? cached : next);
    setLoading(false);
  }, [activeOrgId]);

  useEffect(() => {
    const cached = cachedConversations(activeOrgId);
    if (cached.length > 0) setConversations(cached);
    setLoading(cached.length === 0);
    void refresh();
  }, [activeOrgId, refresh]);

  const deleteChat = async (id: string) => {
    const ok = await deleteConversation(activeOrgId, id);
    if (!ok) {
      toast.error("Could not delete this conversation");
      return;
    }
    setConversations((prev) => {
      const next = prev.filter((item) => item.conversationId !== id);
      rememberConversations(activeOrgId, next);
      return next;
    });
    if (routeChatId === id) router.push(chatHref(null, projectId));
  };

  const api = useMemo<ChatHistoryApi>(
    () => ({
      refresh: () => {
        void refresh();
      },
      registerNewChat: (handler) => {
        newChat.current = handler;
      },
    }),
    [refresh]
  );

  const items: ChatHistoryItem[] = conversations.map((item) => ({
    id: item.conversationId,
    title: item.title,
    updatedAt: item.lastMessageAt || item.updatedAt || "",
    projectId: item.projectId || undefined,
  }));

  return (
    <ChatHistoryContext.Provider value={api}>
      <div className="flex flex-1 h-full min-h-0 min-w-0 bg-[#f4f4f5] dark:bg-[#0b1220]">
        <ChatHistorySidebar
          items={items}
          loading={loading}
          activeId={routeChatId || null}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((value) => !value)}
          newChatHref={chatHref(null, projectId)}
          chatHref={(id) => {
            const conversation = conversations.find((item) => item.conversationId === id);
            return chatHref(id, conversation?.projectId || projectId);
          }}
          onNewChat={() => newChat.current()}
          onDelete={(id) => void deleteChat(id)}
        />
        {children}
      </div>
    </ChatHistoryContext.Provider>
  );
}
