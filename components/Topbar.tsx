import React from "react";
import { ChevronDown, Menu, UserCircle } from "lucide-react";

export function Topbar() {
    return (
        <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 bg-white dark:bg-[#212121] border-b border-[#ececec] dark:border-white/10 z-10 sticky top-0">
            <div className="flex items-center gap-3 text-black dark:text-white">
                <button className="md:hidden p-1.5 -ml-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-300">
                    <Menu className="w-5 h-5" />
                </button>
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
                        Pro Plan
                    </span>
                </div>
            </div>
        </header>
    );
}
