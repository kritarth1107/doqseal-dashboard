import React from "react";
import { ChevronDown, Menu, UserCircle } from "lucide-react";

export function Topbar() {
    return (
        <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 bg-white border-b border-[#ececec] z-10 sticky top-0">
            <div className="flex items-center gap-3 text-black">
                <button className="md:hidden p-1.5 -ml-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-600">
                    <Menu className="w-5 h-5" />
                </button>
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600 border border-blue-200">
                        Pro Plan
                    </span>
                </div>
            </div>
        </header>
    );
}
