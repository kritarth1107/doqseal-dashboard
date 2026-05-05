"use client";
import React, { useState } from "react";
import {
  LayoutDashboard,
  Search,
  Compass,
  PlusSquare,
  Folder,
  BarChart3,
  History,
  Key,
  Activity,
  Users,
  ShieldCheck,
  Settings,
  Menu,
  Download,
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
  Check,
  Plus,
  Database
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { signOut } from "next-auth/react";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showOrgSwitcher, setShowOrgSwitcher] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const { userData, activeOrg, activeOrgId, setActiveOrgId } = useAuth();

  const handleLogout = async () => {
    try {
      // 1. Sign out from NextAuth
      await signOut({ redirect: false });

      // 2. Clear the session_token cookie via our custom logout endpoint
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (response.ok) {
        window.location.href = '/auth';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navGroups = [
    {
      items: [
        { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
        // { name: "AI Search", icon: Search, onClick: () => setShowSearchModal(true) },
        { name: "Explore", icon: Search, href: "/new" },
      ]
    },
    {
      label: "Documents",
      items: [
        { name: "Explore", icon: Compass, href: "/documents/explore" },
        { name: "Request", icon: PlusSquare, href: "/documents/request" },
        { name: "Folder", icon: Folder, href: "/documents/folder" },
      ]
    },
    {
      label: "Analytics",
      items: [
        { name: "Usage", icon: BarChart3, href: "/analytics/usage" },
        { name: "Audit Logs", icon: History, href: "/analytics/audit-logs" },
      ]
    },
    {
      label: "Manage",
      items: [
        { name: "API Keys", icon: Key, href: "/manage/api-keys" },
        { name: "Limits", icon: Activity, href: "/manage/limits" },
        { name: "Members", icon: Users, href: "/manage/members" },
        { name: "Settings", icon: Settings, href: "/settings" },
      ]
    }
  ];

  const NavItem = ({ item }: { item: any }) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;
    const content = (
      <>
        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#D4F46A]" : "text-gray-500 dark:text-gray-400"}`} />
        {!isCollapsed && <span className="flex-1 text-left truncate">{item.name}</span>}
      </>
    );

    const className = `flex items-center gap-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-white/5 py-2 text-sm font-medium transition-colors ${
      isCollapsed ? "justify-center w-10 h-10 px-0" : "w-full px-2.5"
    } ${isActive ? "bg-gray-200/50 dark:bg-white/5 text-black dark:text-white" : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"}`;

    if (item.onClick) {
      return (
        <button onClick={item.onClick} className={className} title={item.name}>
          {content}
        </button>
      );
    }

    return (
      <Link href={item.href} className={className} title={item.name}>
        {content}
      </Link>
    );
  };

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

        {/* Organisation Switcher (Top) */}
        <div className={`px-3 mb-4 relative ${isCollapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={() => setShowOrgSwitcher(!showOrgSwitcher)}
            className={`flex items-center gap-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-white/5 transition-all text-left group ${
              isCollapsed ? "w-10 h-10 justify-center p-0" : "w-full p-2 px-2.5 border border-gray-200/50 dark:border-white/5 shadow-xs"
            }`}
          >
            <div className="w-6 h-6 rounded bg-[#D4F46A] text-black flex items-center justify-center font-bold text-[10px] shrink-0 uppercase">
              {activeOrg?.name?.[0] || 'O'}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-xs font-semibold text-black dark:text-white truncate leading-tight">
                    {activeOrg?.name || userData?.organisationName || 'Loading...'}
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-tighter">
                    {activeOrg?.role || 'Member'}
                  </span>
                </div>
                <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
              </>
            )}
          </button>

          {/* Organisation Switcher Popover (Top-aligned) */}
          {showOrgSwitcher && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowOrgSwitcher(false)}
              />
              <div className={`absolute ${isCollapsed ? 'left-14' : 'left-3 right-3'} top-full mt-2 bg-white dark:bg-[#2c2c2c] border border-gray-200 dark:border-white/10 rounded-xl shadow-lg z-50 overflow-hidden text-sm text-gray-700 dark:text-gray-300 transform origin-top transition-all min-w-[200px]`}>
                <div className="px-3 py-2 border-b border-gray-100 dark:border-white/10">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    Switch Organisation
                  </span>
                </div>
                <div className="p-1.5 max-h-[300px] overflow-y-auto">
                  {userData?.organisations.map((org) => (
                    <button
                      key={org.organisationId}
                      onClick={() => {
                        setActiveOrgId(org.organisationId);
                        setShowOrgSwitcher(false);
                        window.location.reload();
                      }}
                      className={`flex w-full items-center justify-between gap-2 px-2.5 py-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-left ${activeOrgId === org.organisationId ? 'bg-gray-100 dark:bg-white/5' : ''}`}
                    >
                      <div className="flex flex-col truncate">
                        <span className={`text-sm font-medium truncate ${activeOrgId === org.organisationId ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                          {org.name}
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-tighter">
                          {org.role}
                        </span>
                      </div>
                      {activeOrgId === org.organisationId && (
                        <Check className="w-4 h-4 text-[#D4F46A]" />
                      )}
                    </button>
                  ))}
                  
                  <div className="h-px bg-gray-100 dark:bg-white/10 my-1.5" />
                  
                  <Link 
                    href="/manage/create-organisation"
                    onClick={() => setShowOrgSwitcher(false)}
                    className="flex w-full items-center gap-2 px-2.5 py-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-left text-gray-600 dark:text-gray-400"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Create New</span>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className={`space-y-0.5 ${isCollapsed ? 'items-center flex flex-col' : ''}`}>
              {group.label && !isCollapsed && (
                <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1.5 px-2.5 uppercase tracking-wider mt-2">
                  {group.label}
                </div>
              )}
              {group.items.map((item, itemIdx) => (
                <NavItem key={itemIdx} item={item} />
              ))}
            </div>
          ))}
        </div>

        {/* Profile Menu Popover */}
        {showProfileMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowProfileMenu(false)}
            />
            <div className="absolute bottom-[72px] left-2 w-64 bg-white dark:bg-[#2c2c2c] border border-gray-200 dark:border-white/10 rounded-xl shadow-lg z-50 overflow-hidden text-sm text-gray-700 dark:text-gray-300 transform origin-bottom-left transition-all">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10">
                <div className="truncate text-black dark:text-white font-medium">{userData?.email || 'Loading...'}</div>
              </div>
              <div className="p-1.5">
                <Link href="/settings" onClick={() => setShowProfileMenu(false)} className="flex w-full items-center justify-between gap-2 px-2.5 py-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-left">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Settings
                  </div>
                </Link>
                <button className="flex w-full items-center justify-between gap-2 px-2.5 py-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-left">
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><path d="M2 12h20"></path></svg>
                    Language
                  </div>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                
                <div className="h-px bg-gray-100 dark:bg-white/10 my-1 mx-2" />

                <div className="px-2.5 py-2 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  Legal
                </div>
                <Link href="/legal/privacy-policy" onClick={() => setShowProfileMenu(false)} className="flex w-full items-center gap-2 px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-left text-xs">
                  Privacy Policy
                </Link>
                <Link href="/legal/terms-of-service" onClick={() => setShowProfileMenu(false)} className="flex w-full items-center gap-2 px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-left text-xs">
                  Terms of Service
                </Link>
                <Link href="/legal/data-processing-agreement" onClick={() => setShowProfileMenu(false)} className="flex w-full items-center gap-2 px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-left text-xs">
                  Data Processing Agreement
                </Link>

                <div className="h-px bg-gray-100 dark:bg-white/10 my-1 mx-2" />

                <button 
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-2.5 py-2 mt-1 hover:bg-red-500/10 rounded-lg transition-colors text-left text-red-500 font-medium"
                >
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
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 overflow-hidden flex-1'}`}>
            <div className="w-8 h-8 rounded-full bg-[#e3d5c8] text-[#5c4a3d] flex items-center justify-center font-semibold text-sm shrink-0">
              {userData?.avatar ? (
                <img src={userData.avatar} alt={userData.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                userData?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'
              )}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-medium text-black dark:text-white leading-tight truncate">
                  {userData?.name || 'Loading...'}
                </span>
                <span className="text-[10px] text-gray-500 truncate">
                  {userData?.email}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[20vh] font-sans px-4">
          <div
            className="fixed inset-0 bg-black/50 dark:bg-black/80 transition-opacity"
            onClick={() => setShowSearchModal(false)}
          />
          <div className="relative w-full max-w-2xl bg-[#ffffff] dark:bg-[#202020] rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[70vh]">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search documents, logs, and settings"
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
            <div className="px-4 py-12 text-center flex flex-col items-center justify-center gap-2">
              <Search className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500">No results found for "{searchQuery}"</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
