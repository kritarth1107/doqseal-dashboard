"use client";
import React, { useState } from "react";
import { Plus, Search, Home, FileText, Link as LinkIcon, Download, Menu, BotMessageSquare } from "lucide-react";
import Link from "next/link";

const dummyHistory = [
  { id: "chat-1", title: "Which documents have my Gurgaon address?", isStarred: true },
  { id: "chat-2", title: "Prepare a folder of documents for ITR filing this year", isStarred: true },
  { id: "chat-3", title: "Find every NDA signed with vendors this year", isStarred: true },
  { id: "chat-4", title: "Show me all documents expiring this month", isStarred: false },
  { id: "chat-5", title: "Find my last year ITR", isStarred: false },
  { id: "chat-6", title: "Do I have a document with my date of birth on it?", isStarred: false },
  { id: "chat-7", title: "What's my PAN number?", isStarred: false },
  { id: "chat-8", title: "Show me all invoices above ₹10,000", isStarred: false },
  { id: "chat-9", title: "Find all documents with my old Delhi address", isStarred: false },
  { id: "chat-10", title: "Which of my documents are still valid?", isStarred: false },
  { id: "chat-11", title: "Show me all investment proofs for 80C", isStarred: false },
  { id: "chat-12", title: "Find my Form 16 from last two years", isStarred: false },
  { id: "chat-13", title: "Which bank statements do I have from April to March?", isStarred: false },
  { id: "chat-14", title: "Show all employee documents expiring in the next 30 days", isStarred: false },
  { id: "chat-15", title: "Which staff members have not submitted their Aadhaar yet?", isStarred: false },
  { id: "chat-16", title: "Summarise the key clauses in this vendor contract", isStarred: false },
  { id: "chat-17", title: "Show all invoices from this supplier in 2024", isStarred: false }
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const starredChats = dummyHistory.filter(c => c.isStarred);
  const recentChats = dummyHistory.filter(c => !c.isStarred);
  const filteredSearchHistory = dummyHistory.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      <aside
        className={`${isCollapsed ? "w-16" : "w-64"} flex-shrink-0 bg-[#f9f9f9] dark:bg-[#1f1f1f] text-[#333] dark:text-[#ececec] border-r border-[#ececec] dark:border-white/10 flex-col hidden md:flex transition-all duration-300 font-sans relative`}
      >
        {/* Brand Logo & Collapse */}
        <div className={`px-4 py-4 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="bg-[#D4F46A] rounded-lg p-1.5">
                
              <img src="/sakshya_logo.svg" alt="Sakshya Logo" className="w-6 h-6 brightness-0 shrink-0" />
                </div>
              <span className="font-semibold text-xl tracking-tight text-black dark:text-white shrink-0">
                Sakshya
              </span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-500 hover:text-black dark:hover:text-white transition-colors p-1 rounded-md hover:bg-gray-200/50 dark:hover:bg-white/5"
          >
            {isCollapsed ? (
              <Menu className="w-5 h-5" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 3V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>


        {/* Main Navigation */}
        <div className={`px-3 py-2 space-y-0.5 ${isCollapsed ? 'items-center flex flex-col' : ''}`}>
          <Link href="/new" className={`flex items-center gap-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-white/5 py-2 text-sm font-medium transition-colors ${isCollapsed ? 'justify-center w-10 h-10 px-0' : 'w-full px-2.5'}`} title="New Search">
            <BotMessageSquare className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="flex-1 text-left truncate">New Chat</span>}
          </Link>
          <button onClick={() => setShowSearchModal(true)} className={`flex items-center gap-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-white/5 py-2 text-sm font-medium transition-colors w-full ${isCollapsed ? 'justify-center w-10 h-10 px-0' : 'px-2.5'}`} title="Search">
            <Search className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="flex-1 text-left truncate">Search</span>}
          </button>
        </div>

        {/* Main Navigation */}
        <div className={`px-3 py-2 space-y-0.5 ${isCollapsed ? 'items-center flex flex-col' : ''}`}>
       
          <Link href="/folders" className={`flex items-center gap-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-white/5 py-2 text-sm font-medium transition-colors ${isCollapsed ? 'justify-center w-10 h-10 px-0' : 'w-full px-2.5'}`} title="Folder">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-current">
              <path d="M22 19C22 20.1046 21.1046 21 20 21H4C2.89543 21 2 20.1046 2 19V5C2 3.89543 2.89543 3 4 3H9L11 6H20C21.1046 6 22 6.89543 22 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {!isCollapsed && <span className="flex-1 text-left truncate">Folder</span>}
          </Link>
          <Link href="/documents" className={`flex items-center gap-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-white/5 py-2 text-sm font-medium transition-colors ${isCollapsed ? 'justify-center w-10 h-10 px-0' : 'w-full px-2.5'}`} title="Documents">
            <FileText className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="flex-1 text-left truncate">Documents</span>}
          </Link>
          <Link href="/document-link" className={`flex items-center gap-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-white/5 py-2 text-sm font-medium transition-colors ${isCollapsed ? 'justify-center w-10 h-10 px-0' : 'w-full px-2.5'}`} title="Document Link">
            <LinkIcon className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="flex-1 text-left truncate">Document Link</span>}
          </Link>
        </div>

        {/* Tools Section */}
        <div className={`px-3 py-2 space-y-0.5 ${isCollapsed ? 'items-center flex flex-col' : ''}`}>
          {!isCollapsed && (
            <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1.5 px-2.5 uppercase tracking-wider mt-2">
              Tools
            </div>
          )}
          <Link href="/api-management" className={`flex items-center gap-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-white/5 py-2 text-sm font-medium transition-colors ${isCollapsed ? 'justify-center w-10 h-10 px-0 mt-2' : 'w-full px-2.5'}`} title="API">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-current">
              <path d="M10 20L14 4M18 16L22 12L18 8M6 16L2 12L6 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {!isCollapsed && <span className="flex-1 text-left truncate">API</span>}
          </Link>
          <Link href="/connectors" className={`flex items-center gap-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-white/5 py-2 text-sm font-medium transition-colors ${isCollapsed ? 'justify-center w-10 h-10 px-0' : 'w-full px-2.5'}`} title="Connectors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-current">
              <path d="M8 10V20M8 20L4 16M8 20L12 16M16 14V4M16 4L12 8M16 4L20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {!isCollapsed && <span className="flex-1 text-left truncate">Connectors</span>}
          </Link>
          
        </div>

        {/* Scrollable History Section - Hidden when collapsed */}
        {!isCollapsed && (
          <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6 mt-2 overflow-x-hidden [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
            {/* Starred */}
            {starredChats.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1.5 px-2.5 uppercase tracking-wider">
                  Starred
                </div>
                <div className="space-y-0.5">
                  {starredChats.map((chat) => (
                    <Link href={`/chat/${chat.id}`} key={chat.id} className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-white/5 transition-colors truncate">
                      <span className="truncate">{chat.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recents */}
            {recentChats.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1.5 px-2.5 uppercase tracking-wider">
                  Recents
                </div>
                <div className="space-y-0.5">
                  {recentChats.map((chat) => (
                    <Link href={`/chat/${chat.id}`} key={chat.id} className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-white/5 transition-colors truncate">
                      <span className="truncate">{chat.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </nav>
        )}

        {/* Spacer for collapsed state to push avatar down */}
        {isCollapsed && <div className="flex-1" />}

        {/* Profile Menu Popover */}
        {showProfileMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowProfileMenu(false)}
            />
            <div className="absolute bottom-[72px] left-2 w-64 bg-white dark:bg-[#2c2c2c] border border-gray-200 dark:border-white/10 rounded-xl shadow-lg z-50 overflow-hidden text-sm text-gray-700 dark:text-gray-300 transform origin-bottom-left transition-all">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10">
                <div className="truncate text-black dark:text-white font-medium">singhalkritarth@gmail.com</div>
              </div>
              <div className="p-1.5">
                <Link href="/settings" onClick={() => setShowProfileMenu(false)} className="flex w-full items-center justify-between gap-2 px-2.5 py-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-left">
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    Settings
                  </div>
                </Link>
                <button className="flex w-full items-center justify-between gap-2 px-2.5 py-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-left">
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><path d="M2 12h20"></path></svg>
                    Language
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
                <button className="flex w-full items-center gap-2 px-2.5 py-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-left text-gray-500 mb-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  Get help
                </button>

                <div className="h-px bg-gray-100 dark:bg-white/10 my-1 mx-2" />

                <button className="flex w-full items-center gap-2 px-2.5 py-2 mt-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-left">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 16 16 12 12 8"></polyline><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                  Upgrade plan
                </button>
                <button className="flex w-full items-center gap-2 px-2.5 py-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-left">
                  <Download className="w-4 h-4" />
                  Get apps and extensions
                </button>
                <button className="flex w-full items-center gap-2 px-2.5 py-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-left">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
                  Gift Sakshya
                </button>
                <button className="flex w-full items-center justify-between gap-2 px-2.5 py-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-left mb-2">
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    Learn more
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>

                <div className="h-px bg-gray-100 dark:bg-white/10 my-1 mx-2" />

                <button className="flex w-full items-center gap-2 px-2.5 py-2 mt-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-left text-gray-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  Log out
                </button>
              </div>
            </div>
          </>
        )}

        {/* Footer / User Profile */}
        <div
          onClick={() => setShowProfileMenu(true)}
          className={`p-3 mx-2 my-2 rounded-xl hover:bg-gray-200/50 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center group ${isCollapsed ? 'justify-center p-1.5' : 'justify-between'}`}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 overflow-hidden'}`}>
            <div className="w-8 h-8 rounded-full bg-[#e3d5c8] text-[#5c4a3d] flex items-center justify-center font-semibold text-sm shrink-0">
              KA
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-medium text-black dark:text-white leading-tight truncate">Kritarth Agrawal</span>
                <span className="text-xs text-gray-500">Free plan</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-300 dark:hover:bg-gray-700 shrink-0">
              <Download className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          )}
        </div>
      </aside>

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[20vh] font-sans px-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 dark:bg-black/80 transition-opacity"
            onClick={() => setShowSearchModal(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-2xl bg-[#ffffff] dark:bg-[#202020] rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[70vh]">

            {/* Search Input */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search chats and projects"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-black dark:text-white placeholder-gray-500 text-[15px] py-1"
              />
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-1 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            {/* Results List */}
            <div className="overflow-y-auto w-full py-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
              {filteredSearchHistory.length > 0 ? (
                <div className="px-2">
                  {filteredSearchHistory.map((chat) => {
                    const idx = dummyHistory.findIndex(h => h.id === chat.id);
                    const timeText = idx === 0 ? "Enter" : idx < 5 ? "Yesterday" : idx < 10 ? "Past week" : "Past month";
                    return (
                      <Link
                        key={chat.id}
                        href={`/chat/${chat.id}`}
                        onClick={() => setShowSearchModal(false)}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <BotMessageSquare className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate group-hover:text-black dark:group-hover:text-white transition-colors">{chat.title}</span>
                        </div>
                        <span className="text-[12px] text-gray-400 shrink-0 transition-opacity">
                          {timeText}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="px-4 py-12 text-center flex flex-col items-center justify-center gap-2">
                  <Search className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm text-gray-500">No chats found for "{searchQuery}"</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
