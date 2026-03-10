"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, MoreHorizontal, Star, Plus, Mic, ChevronDown, Hand, Lock } from 'lucide-react';

const FolderDetailsPage = ({ params }: { params: { folderId: string } }) => {
    // Dummy folder data
    const folder = {
        id: params?.folderId || "f1",
        name: "Identity Documents",
        description: "An example folder that also doubles as a how-to guide for using Sakshya. Chat with it to learn more about how to get the most out of chatting with Sakshya!",
        badge: "Example folder",
        files: [
            { id: 1, name: "Aadhaar Card.pdf", lines: "2 Pages", type: "PDF" },
            { id: 2, name: "PAN Card.png", lines: "1 Page", type: "IMG" },
        ]
    };

    return (
        <div className="flex-1 flex flex-col h-[100dvh] bg-[#f9f9f9] dark:bg-[#1a1a1a] text-[#333] dark:text-[#ececec] overflow-y-auto">
            <div className="max-w-[1100px] mx-auto w-full px-4 sm:px-8 py-10 flex flex-col min-h-full">
                {/* Back button */}
                <Link href="/folders" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors w-fit mb-6">
                    <ArrowLeft className="w-4 h-4" />
                    All folders
                </Link>

                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-serif text-[#333] dark:text-[#ececec] tracking-tight">{folder.name}</h1>
                        <span className="px-2.5 py-1 text-[11px] font-medium bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-full border border-gray-300 dark:border-white/5">
                            {folder.badge}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                        <button className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                        <button className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors">
                            <Star className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <p className="text-[15px] text-gray-500 dark:text-gray-400 max-w-2xl mb-10 leading-relaxed">
                    {folder.description}
                </p>

                {/* Two Column Layout */}
                <div className="flex flex-col lg:flex-row gap-8 flex-1">

                    {/* Left Column (Chat/Input Area) */}
                    <div className="flex-1 flex flex-col">
                        <div className="bg-white dark:bg-[#2c2c2c] border border-gray-200 dark:border-white/10 rounded-2xl p-4 mb-4 shadow-sm flex flex-col gap-4">
                            <textarea
                                placeholder="How can I help you today?"
                                className="w-full bg-transparent resize-none outline-none text-[15px] text-[#333] dark:text-[#ececec] placeholder-gray-500 dark:placeholder-gray-400 min-h-[50px] max-h-[200px]"
                            />
                            <div className="flex items-center justify-between">
                                <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                                    <Plus className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <button className="flex items-center gap-1 font-medium hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                                        Sakshya AI
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                    </button>
                                    <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                                        <Mic className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-transparent border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
                            <p className="text-[14px] text-gray-500 dark:text-gray-400">
                                Start a chat to keep conversations organized and re-use folder knowledge.
                            </p>
                        </div>
                    </div>

                    {/* Right Column (Files/Context) */}
                    <div className="w-full lg:w-[320px] xl:w-[350px] flex flex-col gap-8 shrink-0">
                        {/* Context Card */}
                        <div className="bg-[#f2f2f2] dark:bg-[#202020] border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                            <div className="mb-4 text-gray-400 dark:text-gray-300">
                                <Hand className="w-6 h-6" />
                            </div>
                            <h3 className="text-[15px] font-medium text-[#333] dark:text-[#ececec] mb-3">
                                Add relevant context for your folder
                            </h3>
                            <p className="text-[13.5px] text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                                Upload documents, images, and other files to the folder for Sakshya AI to reference in your chats.
                            </p>
                            <p className="text-[13.5px] text-gray-500 dark:text-gray-400 leading-relaxed">
                                In this example folder, we've added key files about your identity.
                            </p>
                        </div>

                        {/* Memory */}
                        <div className="border-b border-gray-200 dark:border-white/10 pb-5">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-[14px] font-medium text-[#333] dark:text-[#ececec]">Memory</h3>
                                <span className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-gray-500 bg-white dark:bg-[#2c2c2c] rounded border border-gray-200 dark:border-white/5">
                                    <Lock className="w-3 h-3" />
                                    Only you
                                </span>
                            </div>
                            <p className="text-[13px] text-gray-500 dark:text-gray-400">
                                Folder memory will show here after a few chats.
                            </p>
                        </div>

                        {/* Files */}
                        <div>
                            <h3 className="text-[14px] font-medium text-[#333] dark:text-[#ececec] mb-4">Files</h3>
                            <div className="flex flex-wrap gap-3">
                                {folder.files.map(file => (
                                    <div key={file.id} className="flex flex-col p-3.5 bg-white dark:bg-[#2c2c2c] border border-gray-200 dark:border-white/10 rounded-xl w-[150px] hover:border-gray-300 dark:hover:border-white/20 transition-colors cursor-pointer group shadow-sm">
                                        <span className="text-[13px] font-medium text-[#333] dark:text-[#ececec] mb-6 truncate group-hover:text-black dark:group-hover:text-white transition-colors" title={file.name}>
                                            {file.name}
                                        </span>
                                        <div className="mt-auto">
                                            <span className="text-[12px] text-gray-500 mb-2 block">{file.lines}</span>
                                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded block w-fit border border-gray-200 dark:border-white/5">
                                                {file.type}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    )
}

export default FolderDetailsPage;