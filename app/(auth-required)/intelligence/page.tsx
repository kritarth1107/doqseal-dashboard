"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Folder,
  Clock,
  Upload,
  ArrowUp,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import chatTitlesData from "@/utils/new_chat_titles.json";
import { UploadModal } from "@/components/UploadModal";
import {
  AssistantMessage,
  TypingIndicator,
  UserMessage,
} from "@/components/intelligence/ChatMessage";
import {
  ChatHistorySidebar,
  type ChatHistoryItem,
} from "@/components/intelligence/ChatHistorySidebar";
import { useAuth } from "@/components/AuthProvider";
import { withOrgHeaders } from "@/lib/client-api";
import { isPrescriptionProject } from "@/lib/project-config";
import {
  loadChatSessions,
  saveChatSessions,
  titleFromMessages,
  type StoredChatSession,
  type StoredChatMessage,
} from "@/lib/chat-history";

type Highlight = {
  word: string;
  type: "pill" | "bold";
  variant: string;
  icon?: string;
};

type Greeting = {
  id: string;
  text: string;
  alert: boolean;
  variant: string;
  highlights: Highlight[];
};

type Message = StoredChatMessage;

const renderGreetingText = (greeting: Greeting) => {
  let parts: React.ReactNode[] = [greeting.text];

  greeting.highlights?.forEach((highlight, idx) => {
    const newParts: React.ReactNode[] = [];
    parts.forEach((part, partIdx) => {
      if (typeof part === "string") {
        const subParts = part.split(highlight.word);
        subParts.forEach((sp, i) => {
          newParts.push(sp);
          if (i < subParts.length - 1) {
            const variantStyles =
              (chatTitlesData.pill_variants as Record<string, { bg: string; text: string; border: string }>)[
                highlight.variant
              ] || (chatTitlesData.pill_variants as Record<string, { bg: string; text: string; border: string }>).info;

            if (highlight.type === "pill") {
              newParts.push(
                <span
                  key={`pill-${highlight.word}-${idx}-${partIdx}-${i}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-base sm:text-lg font-sans font-medium border whitespace-nowrap align-text-bottom mx-1 shadow-sm transition-all hover:scale-105 cursor-default translate-y-[-2px]"
                  style={{
                    backgroundColor: variantStyles.bg,
                    color: variantStyles.text,
                    borderColor: variantStyles.border,
                  }}
                >
                  {highlight.icon && (
                    <span className="text-[1.1em] drop-shadow-sm">{highlight.icon}</span>
                  )}
                  {highlight.word}
                </span>
              );
            } else if (highlight.type === "bold") {
              newParts.push(
                <strong
                  key={`bold-${highlight.word}-${idx}-${partIdx}-${i}`}
                  className="font-semibold transition-colors hover:opacity-80 cursor-default"
                  style={{ color: variantStyles.text }}
                >
                  {highlight.word}
                </strong>
              );
            }
          }
        });
      } else {
        newParts.push(part);
      }
    });
    parts = newParts;
  });

  return parts;
};

type ProjectSummary = {
  projectId: string;
  name: string;
  extractionHint?: string;
};

const NewSearchPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeOrgId } = useAuth();
  const projectId = searchParams.get("project") ?? "";
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [greeting, setGreeting] = useState<Greeting | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<StoredChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);

  const isTyping = query.trim().length > 0;
  const inChat = messages.length > 0;

  useEffect(() => {
    const greetingsList = chatTitlesData.greetings as Greeting[];
    const randomGreeting = greetingsList[Math.floor(Math.random() * greetingsList.length)];
    setGreeting(randomGreeting);
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!activeOrgId) {
      setSessions([]);
      return;
    }
    setSessions(loadChatSessions(activeOrgId));
  }, [activeOrgId]);

  useEffect(() => {
    async function loadProject() {
      if (!projectId || !activeOrgId) {
        setProject(null);
        return;
      }
      try {
        const res = await fetch(
          `/api/projects/${projectId}`,
          withOrgHeaders(activeOrgId)
        );
        if (!res.ok) throw new Error("Project not found");
        const data = await res.json();
        setProject(data.project);
      } catch {
        setProject(null);
      }
    }
    loadProject();
  }, [projectId, activeOrgId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const persistSessions = (next: StoredChatSession[]) => {
    setSessions(next);
    if (activeOrgId) saveChatSessions(activeOrgId, next);
  };

  const upsertActiveSession = (nextMessages: Message[]) => {
    if (!activeOrgId || nextMessages.length === 0) return;

    const now = new Date().toISOString();
    const title = titleFromMessages(nextMessages);
    const preview =
      nextMessages.filter((m) => m.role === "assistant").at(-1)?.content.slice(0, 60) ||
      undefined;
    const chatId = activeChatId ?? crypto.randomUUID();
    if (!activeChatId) setActiveChatId(chatId);

    setSessions((prev) => {
      const existing = prev.find((s) => s.id === chatId);
      const nextSession: StoredChatSession = {
        id: chatId,
        title,
        preview,
        updatedAt: now,
        projectId: projectId || existing?.projectId,
        messages: nextMessages,
      };
      const next = existing
        ? prev.map((s) => (s.id === chatId ? nextSession : s))
        : [nextSession, ...prev];

      if (activeOrgId) saveChatSessions(activeOrgId, next);
      return next;
    });
  };

  const startNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setQuery("");
  };

  const selectChat = (id: string) => {
    const session = sessions.find((s) => s.id === id);
    if (!session) return;
    setActiveChatId(id);
    setMessages(session.messages);
    setQuery("");
    if (session.projectId && session.projectId !== projectId) {
      router.push(`/intelligence?project=${session.projectId}`);
    }
  };

  const deleteChat = (id: string) => {
    const next = sessions.filter((s) => s.id !== id);
    persistSessions(next);
    if (activeChatId === id) {
      startNewChat();
    }
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const history = [...messages, userMsg];
    setMessages(history);
    upsertActiveSession(history);
    setQuery("");
    setLoading(true);

    try {
      const res = await fetch("/api/intelligence/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const withAssistant: Message[] = [
        ...history,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
          documents: data.documents,
        },
      ];
      setMessages(withAssistant);
      upsertActiveSession(withAssistant);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to get response");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (results: { documentId: string; projectId: string | null }[]) => {
    const last = results[results.length - 1];
    if (!last) return;
    toast.success("Upload queued — opening extraction…");
    if (last.projectId) {
      router.push(`/projects/${last.projectId}/documents/${last.documentId}`);
    } else {
      router.push("/drive");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(query);
    }
  };

  const historyItems: ChatHistoryItem[] = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    updatedAt: s.updatedAt,
    preview: s.preview,
    projectId: s.projectId,
  }));

  return (
    <div className="flex-1 flex h-full min-h-0 bg-[#f4f4f5] dark:bg-[#0b1220]">
      <ChatHistorySidebar
        items={historyItems}
        activeId={activeChatId}
        collapsed={historyCollapsed}
        onToggleCollapsed={() => setHistoryCollapsed((v) => !v)}
        onNewChat={startNewChat}
        onSelect={selectChat}
        onDelete={deleteChat}
      />

      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        {project && (
          <div className="shrink-0 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#111827] px-4 sm:px-6 py-3">
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2563eb]/10">
                <Sparkles className="w-4 h-4 text-[#2563eb]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                  {project.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                  {project.extractionHint}
                </p>
              </div>
              <Link
                href={`/projects/${projectId}`}
                className="text-xs font-medium text-[#2563eb] hover:underline shrink-0"
              >
                Documents
              </Link>
            </div>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto w-full">
          <div
            className={`max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 ${
              inChat ? "pb-4" : "min-h-full flex flex-col items-center justify-center pb-32"
            }`}
          >
            {!inChat && (
              <div className="flex flex-col items-center gap-4 mb-10 text-center">
                <div className="bg-[#2563eb] rounded-xl p-2.5 shadow-sm">
                  <img
                    src="/doqseal_logo_white.svg"
                    alt="DoqSeal Logo"
                    className="w-8 h-8 shrink-0"
                  />
                </div>
                <h1
                  className={`text-3xl sm:text-[2rem] font-serif text-[#333] dark:text-slate-100 tracking-tight leading-snug max-w-[90%] transition-all duration-700 ${
                    isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                >
                  {greeting && renderGreetingText(greeting)}
                </h1>
              </div>
            )}

            {inChat && (
              <div className="space-y-6">
                {messages.map((message) =>
                  message.role === "user" ? (
                    <UserMessage key={message.id} content={message.content} />
                  ) : (
                    <AssistantMessage
                      key={message.id}
                      content={message.content}
                      documents={message.documents}
                    />
                  )
                )}
                {loading && <TypingIndicator />}
              </div>
            )}

            {!inChat && (
              <div
                className={`flex flex-wrap items-center justify-center gap-2 mt-2 transition-opacity duration-300 ${
                  isTyping ? "opacity-0 pointer-events-none" : "opacity-100"
                }`}
              >
                {isPrescriptionProject(projectId) ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        sendMessage("Show me the prescription of Afsana Pinjari")
                      }
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                    >
                      <Search className="w-4 h-4" />
                      Afsana prescription
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        sendMessage("List medications and dosages for Afsana Pinjari")
                      }
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                    >
                      <Folder className="w-4 h-4 text-[#2563eb]" />
                      Medication summary
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        sendMessage(
                          "What is the diagnosis and prescriber on Afsana Pinjari's prescription?"
                        )
                      }
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                    >
                      <Clock className="w-4 h-4 text-amber-600" />
                      Diagnosis & prescriber
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsUploadModalOpen(true)}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      Upload prescription
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        sendMessage(
                          "Summarize the most recent documents in this organisation"
                        )
                      }
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                    >
                      <Search className="w-4 h-4" />
                      Recent documents
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        sendMessage(
                          "What key entities and pointers were extracted from my latest uploads?"
                        )
                      }
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                    >
                      <Folder className="w-4 h-4 text-[#2563eb]" />
                      Extraction pointers
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsUploadModalOpen(true)}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      Upload document
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#111827] px-4 sm:px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111827] shadow-sm overflow-hidden focus-within:border-[#2563eb]/40 focus-within:ring-2 focus-within:ring-[#2563eb]/10 transition-all">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={inChat ? 2 : 3}
                className="w-full bg-transparent border-none focus:ring-0 text-gray-900 dark:text-slate-100 px-4 py-3 outline-none text-[15px] placeholder-gray-400 resize-none"
                placeholder={
                  project
                    ? isPrescriptionProject(projectId)
                      ? "Ask about prescriptions, medications, dosages…"
                      : "Ask about documents in this project…"
                    : "Ask across your organisation documents and projects…"
                }
              />
              <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-white/10 bg-gray-50/60 dark:bg-slate-900/40">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  disabled={!projectId}
                  title={projectId ? "Upload document" : "Open a project to upload"}
                  className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-gray-400 hidden sm:inline">
                    DoqSeal AI
                  </span>
                  <button
                    type="button"
                    onClick={() => sendMessage(query)}
                    disabled={!isTyping || loading}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563eb] text-white hover:bg-[#1d4ed8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          organisationId={activeOrgId}
          projectId={projectId || undefined}
          onSuccess={handleUploadSuccess}
        />
      </div>
    </div>
  );
};

function IntelligenceFallback() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#f9f9f9] dark:bg-[#0b1220]">
      <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
    </div>
  );
}

export default function IntelligencePage() {
  return (
    <Suspense fallback={<IntelligenceFallback />}>
      <NewSearchPage />
    </Suspense>
  );
}
