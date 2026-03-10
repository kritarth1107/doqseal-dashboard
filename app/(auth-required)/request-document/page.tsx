"use client";
import React, { useState } from 'react';
import {
    Plus,
    Search,
    Copy,
    Check,
    FileText,
    MoreVertical,
    ExternalLink,
    ShieldAlert
} from 'lucide-react';

const mockRequests = [
    {
        id: "req-1",
        recipientName: "Rahul Sharma",
        recipientEmail: "rahul.s@example.com",
        documentsRequested: ["PAN Card", "Aadhaar", "3 Months Bank Statement"],
        link: "https://sakshya.io/r/q8xZp2n9",
        createdAt: "Oct 24, 2024",
        expiresAt: "Oct 31, 2024",
        status: "Active"
    },
    {
        id: "req-2",
        recipientName: "Sneha Patel",
        recipientEmail: "sneha.patel@acmecorp.in",
        documentsRequested: ["GST Registration", "Company PAN", "Utility Bill"],
        link: "https://sakshya.io/r/m4vKj7h1",
        createdAt: "Oct 20, 2024",
        expiresAt: "Oct 27, 2024",
        status: "Active"
    },
    {
        id: "req-3",
        recipientName: "Amit Kumar",
        recipientEmail: "amitk@gmail.com",
        documentsRequested: ["ITR Last 2 Years", "Form 16"],
        link: "https://sakshya.io/r/t9pLq5w2",
        createdAt: "Sep 15, 2024",
        expiresAt: "Sep 22, 2024",
        status: "Expired"
    }
];

export default function RequestDocumentPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

    const handleCopyLink = (link: string, id: string) => {
        navigator.clipboard.writeText(link);
        setCopiedLinkId(id);
        setTimeout(() => setCopiedLinkId(null), 2000);
    };

    const filteredRequests = mockRequests.filter(req =>
        req.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-[#f9f9f9] dark:bg-[#1f1f1f]">
            <div className="flex-1 overflow-y-auto w-full custom-scrollbar p-4 sm:p-8">
                <div className="max-w-6xl mx-auto flex flex-col gap-6 sm:gap-8 pb-20">

                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 md:mt-0">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-semibold text-[#333] dark:text-[#ececec] tracking-tight mb-2">Document Requests</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                                Manage and track secure links sent to collect documents from users.
                            </p>
                        </div>

                        <button className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-black bg-[#D4F46A] hover:bg-[#cbf046] transition-colors rounded-xl shadow-sm whitespace-nowrap">
                            <Plus className="w-4 h-4" />
                            Create New Request
                        </button>
                    </div>

                    {/* Filters & Search */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-[#2c2c2c] border border-gray-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#333] dark:text-[#ececec] placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 transition-all shadow-sm"
                            />
                        </div>

                        <div className="hidden sm:flex items-center gap-2">
                            <select className="bg-white dark:bg-[#2c2c2c] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 outline-none cursor-pointer shadow-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <option>All Statuses</option>
                                <option>Active</option>
                                <option>Expired</option>
                            </select>
                        </div>
                    </div>

                    {/* Request List */}
                    <div className="bg-white dark:bg-[#2c2c2c] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm flex flex-col">

                        {/* Table Header */}
                        <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/80 dark:bg-black/20 border-b border-gray-100 dark:border-white/5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <div className="col-span-3">Requested From</div>
                            <div className="col-span-4">Requested Documents</div>
                            <div className="col-span-3 pl-2">Secure Link</div>
                            <div className="col-span-2 text-right">Details</div>
                        </div>

                        {/* Table Body / Cards */}
                        <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/5">
                            {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                                <div key={req.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors p-4 sm:px-6 lg:py-5 flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-4 items-start lg:items-center relative">

                                    {/* Requested From */}
                                    <div className="col-span-3 flex xs:items-center gap-3 w-full">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-semibold text-[13px] tracking-wider shrink-0">
                                            {req.recipientName.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div className="flex flex-col truncate">
                                            <span className="text-sm font-medium text-[#333] dark:text-[#ececec] truncate">{req.recipientName}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{req.recipientEmail}</span>
                                        </div>
                                    </div>

                                    {/* Requested Documents Pills */}
                                    <div className="col-span-4 w-full">
                                        <div className="flex flex-wrap gap-1.5 w-full">
                                            {req.documentsRequested.slice(0, 3).map((doc, idx) => (
                                                <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-full shadow-sm whitespace-nowrap">
                                                    <FileText className="w-3 h-3 text-gray-400 shrink-0" />
                                                    <span className="truncate max-w-[120px]">{doc}</span>
                                                </span>
                                            ))}
                                            {req.documentsRequested.length > 3 && (
                                                <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 rounded-full whitespace-nowrap">
                                                    +{req.documentsRequested.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Minimal Link Section */}
                                    <div className="col-span-3 flex items-center gap-2 w-full lg:w-auto mt-1 lg:mt-0 bg-gray-50 dark:bg-black/20 lg:bg-transparent rounded-lg p-2 lg:p-0 border border-gray-200 lg:border-none dark:border-white/5 lg:pl-2">
                                        <ExternalLink className="w-4 h-4 text-gray-400 shrink-0 hidden lg:block" />
                                        <div className="flex-1 lg:flex-none truncate text-sm text-gray-600 dark:text-gray-300 font-mono">
                                            {req.link.replace('https://', '')}
                                        </div>
                                        <button
                                            onClick={() => handleCopyLink(req.link, req.id)}
                                            className="p-1.5 text-gray-400 hover:text-black dark:hover:text-white bg-white lg:bg-transparent dark:bg-[#333] border border-gray-200 lg:border-none dark:border-gray-600 rounded-md lg:rounded-none shadow-sm lg:shadow-none hover:bg-gray-100 lg:hover:bg-transparent dark:hover:bg-white/10 transition-colors shrink-0"
                                            title="Copy Link"
                                        >
                                            {copiedLinkId === req.id ? (
                                                <Check className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Details / Dates & Actions */}
                                    <div className="col-span-2 w-full flex items-center justify-between lg:justify-end gap-3 mt-1 lg:mt-0 xl:pl-4">
                                        <div className="flex flex-col lg:items-end gap-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`inline-flex items-center w-2 h-2 rounded-full ${req.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{req.status}</span>
                                            </div>
                                            <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                                {req.status === 'Active' ? 'Expires' : 'Expired'} {req.expiresAt}
                                            </div>
                                        </div>

                                        <button className="p-1.5 text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors opacity-100 lg:opacity-0 group-hover:opacity-100 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 shrink-0">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </div>

                                </div>
                            )) : (
                                <div className="px-6 py-16 text-center flex flex-col items-center justify-center gap-3">
                                    <div className="w-12 h-12 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-2">
                                        <ShieldAlert className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <h3 className="text-base font-medium text-[#333] dark:text-[#ececec]">No requests found</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                                        {searchQuery ? `No document requests matched "${searchQuery}".` : "You haven't created any document requests yet. Create a new request to generate a secure link."}
                                    </p>
                                    {!searchQuery && (
                                        <button className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-black bg-[#D4F46A] hover:bg-[#cbf046] transition-colors rounded-xl shadow-sm">
                                            <Plus className="w-4 h-4" />
                                            Create New Request
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
