"use client";
import Link from "next/link";
import React from "react";

export function TopHeader() {
  return (
    <div className="absolute top-4 right-6 flex items-center justify-end z-10">
      <div className="flex items-center text-xs font-medium text-gray-500 bg-white dark:bg-[#2c2c2c] border border-gray-200 dark:border-white/10 rounded-full px-3 py-1.5 shadow-sm">
        <span className="text-gray-400">Pro plan</span>
        <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
        <Link 
          href="#" 
          className="text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white transition-colors"
        >
          Pilot
        </Link>
      </div>
    </div>
  );
}
