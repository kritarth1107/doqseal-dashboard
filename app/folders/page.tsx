import React from 'react';
import { Search, Plus, ChevronDown, Lock, Users, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const dummyFolders = [
    { id: "f1", name: "Identity Documents", icon: "🪪", docCount: 4, hint: "Aadhaar, PAN, Passport, Voter ID, Driving Licence", updatedStr: "2 days ago", isLocked: true, isShared: false, hasExpiring: false },
    { id: "f2", name: "Financial Documents", icon: "💰", docCount: 12, hint: "ITR, Form 16, Bank statements, salary slips", updatedStr: "1 week ago", isLocked: false, isShared: true, hasExpiring: false },
    { id: "f3", name: "Property & Assets", icon: "🏠", docCount: 3, hint: "Sale deeds, registry, NOC, mutation papers", updatedStr: "3 weeks ago", isLocked: true, isShared: false, hasExpiring: false },
    { id: "f4", name: "Medical Records", icon: "🏥", docCount: 8, hint: "Reports, prescriptions, insurance, discharge summaries", updatedStr: "1 month ago", isLocked: false, isShared: false, hasExpiring: false },
    { id: "f5", name: "Education", icon: "🎓", docCount: 6, hint: "Marksheets, degree certificates, transcripts", updatedStr: "2 months ago", isLocked: false, isShared: false, hasExpiring: false },
    { id: "f6", name: "Work & Employment", icon: "💼", docCount: 5, hint: "Offer letters, relieving letters, experience certs", updatedStr: "3 days ago", isLocked: false, isShared: false, hasExpiring: false },
    { id: "f7", name: "Invoices & Bills", icon: "🧾", docCount: 24, hint: "Utility bills, purchase invoices, receipts", updatedStr: "Yesterday", isLocked: false, isShared: true, hasExpiring: false },
    { id: "f8", name: "Agreements & Contracts", icon: "📝", docCount: 7, hint: "NDAs, rent agreements, vendor contracts", updatedStr: "5 days ago", isLocked: true, isShared: true, hasExpiring: true },
];

const FoldersPage = () => {
    return (
        <div className="flex-1 flex flex-col h-full bg-[#f9f9f9] dark:bg-[#1f1f1f] relative overflow-hidden">

            {/* Top Right Header - Plan & Upgrade */}
            <div className="absolute top-4 right-6 flex items-center justify-end w-full z-10">
                <div className="flex items-center text-xs font-medium text-gray-500 bg-white dark:bg-[#2c2c2c] border border-gray-200 dark:border-white/10 rounded-full px-3 py-1.5 shadow-sm">
                    <span className="text-gray-400">Free plan</span>
                    <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                    <Link href="#" className="text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white transition-colors">Upgrade</Link>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto w-full px-4 sm:px-8 pt-24 pb-32">
                <div className="max-w-4xl mx-auto w-full flex flex-col">

                    {/* Header */}
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-serif text-[#333] dark:text-[#ececec] tracking-tight mb-2">
                                My Folders
                            </h1>
                            <p className="text-[15px] text-gray-500 dark:text-gray-400">
                                Organise your documents into folders. Folders can be shared, locked, or linked to a document request.
                            </p>
                        </div>
                        <button className="flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium text-black bg-white rounded-lg hover:bg-gray-100 transition-colors shadow-sm shrink-0">
                            <Plus className="w-4 h-4 shrink-0" />
                            New folder
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-6">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="w-full bg-[#f0f0f0] dark:bg-[#2c2c2c] border border-transparent focus:border-gray-300 dark:focus:border-white/20 rounded-xl text-[#333] dark:text-[#ececec] pl-10 pr-4 py-3 outline-none text-[15px] placeholder-gray-500 dark:placeholder-gray-400 transition-all font-sans"
                            placeholder="Search folders..."
                        />
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-end mb-6">
                        <div className="flex items-center gap-2 text-[13px] text-gray-500">
                            <span>Sort by</span>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-gray-700 dark:text-gray-300 font-medium">
                                Activity
                                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                            </button>
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dummyFolders.map((folder) => (
                            <Link href={`/folder/${folder.id}`} key={folder.id} className="flex flex-col p-4 bg-white dark:bg-[#2c2c2c] border border-gray-200 dark:border-white/10 rounded-xl hover:shadow-md transition-all group h-[160px] cursor-pointer">
                                <div className="flex items-start justify-between gap-3 mb-2.5">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="text-xl shrink-0">{folder.icon}</span>
                                        <h3 className="text-[15px] font-medium text-[#333] dark:text-[#ececec] truncate leading-tight mt-0.5">
                                            {folder.name}
                                        </h3>
                                    </div>
                                    <span className="px-2 py-[3px] text-[11px] font-medium bg-gray-100 dark:bg-[#383838] text-gray-600 dark:text-gray-300 rounded-[#000] border border-gray-200 dark:border-white/5 shrink-0">
                                        {folder.docCount} docs
                                    </span>
                                </div>
                                <p className="text-[13px] text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 flex-1 leading-snug">
                                    {folder.hint}
                                </p>
                                <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 mt-auto font-medium">
                                    <span className="truncate">Updated {folder.updatedStr}</span>
                                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                        {folder.isLocked && <span title="Locked Folder" className="flex items-center justify-center"><Lock className="w-3.5 h-3.5 text-gray-400" /></span>}
                                        {folder.isShared && <span title="Shared Folder" className="flex items-center justify-center"><Users className="w-3.5 h-3.5 text-blue-400" /></span>}
                                        {folder.hasExpiring && <span title="Contains expiring documents" className="flex items-center justify-center"><AlertCircle className="w-3.5 h-3.5 text-red-500" /></span>}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                </div>
            </div>

        </div>
    )
}

export default FoldersPage