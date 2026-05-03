"use client";
import React from "react";
import { useAuth } from "@/components/AuthProvider";

export function TopHeader() {
  const { userData } = useAuth();
  
  return (
    <div className="absolute top-4 right-6 flex items-center justify-end z-10">
      <div className="flex items-center text-xs font-medium text-gray-500 bg-white dark:bg-[#2c2c2c] border border-gray-200 dark:border-white/10 rounded-full px-3 py-1.5 shadow-sm">
        <span className="text-gray-400">
          {userData?.memberships?.[0]?.organisation?.name || 'Organisation'}
        </span>
        <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
        <span className="text-gray-700 dark:text-gray-200 uppercase tracking-tight font-bold">
          Pilot
        </span>
      </div>
    </div>
  );
}
