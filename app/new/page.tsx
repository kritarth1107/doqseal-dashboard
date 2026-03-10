"use client";
import React, { useState } from 'react';
import { Search, Folder, Clock, Upload, Monitor, ArrowUp } from 'lucide-react';
import Link from 'next/link';

const NewSearchPage = () => {
    const [query, setQuery] = useState("");
    const isTyping = query.trim().length > 0;

    return (
        <div className="flex-1 flex flex-col h-full bg-[#f9f9f9] dark:bg-[#1f1f1f] relative">

            {/* Top Right Header - Plan & Upgrade */}
            <div className="absolute top-4 right-6 flex items-center justify-end w-full z-10">
                <div className="flex items-center text-xs font-medium text-gray-500 bg-white dark:bg-[#2c2c2c] border border-gray-200 dark:border-white/10 rounded-full px-3 py-1.5 shadow-sm">
                    <span className="text-gray-400">Free plan</span>
                    <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                    <Link href="#" className="text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white transition-colors">Upgrade</Link>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto w-full flex flex-col items-center justify-center p-4 sm:p-6 pb-32">
                <div className="max-w-3xl w-full flex flex-col items-center justify-center -mt-16 text-center">

                    {/* Greeting Header */}
                    <div className="flex flex-col items-center gap-3 mb-8">
                        <img src="/sakshya_logo.svg" alt="Sakshya" className="w-8 h-8 dark:invert dark:brightness-0 opacity-80" />
                        <h1 className="text-3xl sm:text-4xl font-serif text-[#333] dark:text-[#ececec] tracking-tight">
                            Good Morning, Kritarth. You have 3 documents expiring this month.
                        </h1>
                    </div>

                    {/* Main Input Area */}
                    <div className="w-full max-w-2xl bg-white dark:bg-[#2c2c2c] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col focus-within:ring-1 focus-within:ring-gray-300 dark:focus-within:ring-gray-500 transition-all">
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-0 text-[#333] dark:text-[#ececec] px-4 py-4 outline-none text-[15px] placeholder-gray-400 dark:placeholder-gray-500 resize-none min-h-[100px]"
                            placeholder="What would you like to find or do?"
                        />
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50 dark:bg-black/10 border-t border-gray-100 dark:border-white/5">
                            <button className="p-1.5 text-gray-400 hover:text-black dark:hover:text-white transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-white/10">
                                <Monitor className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3">
                                <button className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-500 hover:text-black dark:hover:text-white transition-colors">
                                    Sonnet 4.6
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-70">
                                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>

                                {/* Voice / Send Button Toggle */}
                                <div className="relative w-[32px] h-[32px]">
                                    <button
                                        className={`absolute inset-0 flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white transition-all duration-300 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 ${isTyping ? 'opacity-0 scale-50 rotate-[-90deg] pointer-events-none' : 'opacity-100 scale-100 rotate-0'
                                            }`}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M5 20V4M12 20V10M19 20V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    <button
                                        className={`absolute inset-0 flex items-center justify-center bg-black dark:bg-white text-white dark:text-black transition-all duration-300 rounded-lg shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 ${isTyping ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-90 pointer-events-none'
                                            }`}
                                    >
                                        <ArrowUp className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Chips */}
                    <div
                        className={`flex flex-wrap items-center justify-center gap-2 mt-6 transition-opacity duration-300 ease-in-out ${isTyping ? 'opacity-0 pointer-events-none' : 'opacity-100'
                            }`}
                    >
                        <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-[#2c2c2c] border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm">
                            <Search className="w-4 h-4" />
                            Find a Document
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-[#2c2c2c] border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm">
                            <Folder className="w-4 h-4 text-yellow-500" />
                            Prepare ITR folder
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-[#2c2c2c] border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm">
                            <Clock className="w-4 h-4 text-red-500" />
                            Expiring Soon
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-[#2c2c2c] border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm">
                            <Upload className="w-4 h-4" />
                            Upload
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-[#2c2c2c] border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm">
                            <svg className="w-4 h-4 drop-shadow-sm" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15.3 10L11.5 16.5L12.5 18H20.5L21.5 16.5L15.3 10Z" fill="#FFC107" />
                                <path d="M8.7 10L2.5 20.5L4 23H11.5L15.3 16.5L8.7 10Z" fill="#4CAF50" />
                                <path d="M15.3 10L8.7 10L11.5 5L15.3 10Z" fill="#2196F3" />
                            </svg>
                            From Drive
                        </button>
                    </div>

                </div>
            </div>

        </div>
    )
}

export default NewSearchPage