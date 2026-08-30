"use client";

import { MessageSquarePlus, PanelLeftClose, PanelLeft, Trash2 } from "lucide-react";

export type ChatHistoryItem = {
  id: string;
  title: string;
  updatedAt: string;
  preview?: string;
  projectId?: string;
};

export function ChatHistorySidebar({
  items,
  activeId,
  collapsed,
  onToggleCollapsed,
  onNewChat,
  onSelect,
  onDelete,
}: {
  items: ChatHistoryItem[];
  activeId: string | null;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <aside
      className={`${
        collapsed ? "w-12" : "w-64"
      } shrink-0 hidden md:flex flex-col h-full border-r border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f172a] transition-all duration-200`}
    >
      <div
        className={`flex items-center gap-2 border-b border-gray-100 dark:border-white/10 ${
          collapsed ? "justify-center p-2" : "justify-between px-3 py-3"
        }`}
      >
        {!collapsed && (
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Chats
          </p>
        )}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
          aria-label={collapsed ? "Expand chat history" : "Collapse chat history"}
        >
          {collapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className={`p-2 ${collapsed ? "flex justify-center" : ""}`}>
        <button
          type="button"
          onClick={onNewChat}
          className={`flex items-center gap-2 rounded-lg text-sm font-medium text-[#2563eb] bg-[#2563eb]/10 hover:bg-[#2563eb]/15 transition-colors ${
            collapsed ? "w-8 h-8 justify-center" : "w-full px-3 py-2"
          }`}
          title="New chat"
        >
          <MessageSquarePlus className="w-4 h-4 shrink-0" />
          {!collapsed && <span>New chat</span>}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
        {items.length === 0 && !collapsed && (
          <p className="px-2 py-6 text-xs text-center text-gray-400">
            No chats yet. Start a conversation to see it here.
          </p>
        )}
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <div
              key={item.id}
              className={`group relative flex items-center rounded-lg transition-colors ${
                active
                  ? "bg-blue-50 dark:bg-blue-950/40"
                  : "hover:bg-gray-50 dark:hover:bg-slate-800/60"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className={`flex-1 min-w-0 text-left ${
                  collapsed ? "p-2 flex justify-center" : "px-3 py-2.5 pr-8"
                }`}
                title={item.title}
              >
                {collapsed ? (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      active ? "bg-[#2563eb]" : "bg-gray-300 dark:bg-slate-600"
                    }`}
                  />
                ) : (
                  <>
                    <p
                      className={`text-sm truncate ${
                        active
                          ? "text-[#2563eb] font-medium"
                          : "text-gray-800 dark:text-slate-200"
                      }`}
                    >
                      {item.title}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                      {formatRelative(item.updatedAt)}
                      {item.preview ? ` · ${item.preview}` : ""}
                    </p>
                  </>
                )}
              </button>
              {!collapsed && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  className="absolute right-1.5 p-1.5 rounded-md text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-opacity"
                  aria-label="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function formatRelative(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
