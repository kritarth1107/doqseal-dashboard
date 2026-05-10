"use client";
import React, { useState } from 'react';
import { Search, Filter, Eye, Maximize2, FileText, Image as ImageIcon, MoreVertical, Plus, Download, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { UploadModal } from '@/components/UploadModal';

const dummyDocuments = [
    { id: "d1", title: "Aadhaar Card", fileName: "aadhaar_front_back.pdf", type: "PDF", category: "Identity", size: "2.4 MB", date: "Oct 12, 2024" },
    { id: "d2", title: "Pan Card", fileName: "pan_card_kritarth.jpg", type: "IMAGE", category: "Identity", size: "1.1 MB", date: "Oct 10, 2024" },
    { id: "d3", title: "Rental Agreement 2024", fileName: "rent_agreement_gurgaon.pdf", type: "PDF", category: "Property", size: "5.7 MB", date: "Sep 28, 2024" },
    { id: "d4", title: "Q2 Electricity Bill", fileName: "dhbvn_bill_q2.pdf", type: "PDF", category: "Utility", size: "450 KB", date: "Sep 15, 2024" },
    { id: "d5", title: "Salary Slip August", fileName: "salary_aug_2024.pdf", type: "PDF", category: "Financial", size: "800 KB", date: "Sep 01, 2024" },
    { id: "d6", title: "Bank Statement FY24", fileName: "hdfc_statement_fy24.csv", type: "CSV", category: "Financial", size: "3.2 MB", date: "Aug 25, 2024" },
    { id: "d7", title: "Vehicle Registration", fileName: "rc_haryana.pdf", type: "PDF", category: "Vehicle", size: "1.5 MB", date: "Aug 10, 2024" },
    { id: "d8", title: "Health Insurance Policy", fileName: "star_health_2024.pdf", type: "PDF", category: "Medical", size: "4.1 MB", date: "Jul 22, 2024" },
];

export default function DocumentsPage() {
    const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const handleUpload = (files: File[]) => {
        console.log("Uploading files:", files);
        // Here you would typically integrate with your backend upload logic
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[#f9f9f9] relative overflow-hidden text-[#333]">
            {/* Main scrollable area */}
            <div className="flex-1 overflow-y-auto w-full px-4 sm:px-8 py-10">
                <div className="max-w-6xl mx-auto w-full flex flex-col">

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-serif tracking-tight mb-1">My Documents</h1>
                            <p className="text-[14px] text-gray-500">
                                Manage, view, and organize all your uploaded documents.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-black bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-xl shadow-sm">
                                <Filter className="w-4 h-4" />
                                Filter
                            </button>
                            <button
                                onClick={() => setIsUploadModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 transition-colors rounded-xl shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Upload
                            </button>
                        </div>
                    </div>

                    {/* Search and Tabs */}
                    <div className="flex flex-col md:flex-row items-baseline md:items-center justify-between gap-4 mb-6">
                        <div className="relative w-full md:w-[350px]">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="w-4 h-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="w-full bg-white border border-gray-200 focus:border-gray-400 rounded-xl text-[14px] pl-10 pr-4 py-2.5 outline-none placeholder-gray-500 transition-all shadow-sm"
                                placeholder="Search by title, category, or file name..."
                            />
                        </div>

                        <div className="flex items-center gap-6 text-[14px] font-medium border-b border-gray-200 w-full md:w-auto overflow-x-auto whitespace-nowrap">
                            <button className="pb-3 border-b-2 border-black text-black">All Documents</button>
                            <button className="pb-3 border-b-2 border-transparent text-gray-400 hover:text-gray-600">Recent</button>
                            <button className="pb-3 border-b-2 border-transparent text-gray-400 hover:text-gray-600">Starred</button>
                            <button className="pb-3 border-b-2 border-transparent text-gray-400 hover:text-gray-600">Archived</button>
                        </div>
                    </div>

                    {/* Documents List */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 text-[12px] font-medium text-gray-500 uppercase tracking-wider bg-gray-50/50">
                            <div className="col-span-12 md:col-span-4 pl-2">Document</div>
                            <div className="col-span-3 hidden md:block">Category</div>
                            <div className="col-span-2 hidden md:block">Size</div>
                            <div className="col-span-2 hidden md:block">Uploaded</div>
                            <div className="col-span-1 hidden md:block text-right pr-2">Actions</div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-100">
                            {dummyDocuments.map((doc) => (
                                <div key={doc.id} className="flex flex-col group hover:bg-gray-50/50 transition-colors">
                                    <div className="grid grid-cols-12 gap-4 p-4 items-center text-[14px]">
                                        {/* Document Info */}
                                        <div className="col-span-10 md:col-span-4 flex items-center gap-3 pl-2 cursor-pointer" onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}>
                                            <div className={`p-2 rounded-lg shrink-0 ${doc.type === 'PDF' ? 'bg-red-50 text-red-500 : doc.type === 'CSV' ? 'bg-green-50 text-green-500 : 'bg-blue-50 text-blue-500
                                                {doc.type === 'IMAGE' ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="font-medium text-[#333] truncate">{doc.title}</span>
                                                <span className="text-[12px] text-gray-500 truncate mt-0.5">{doc.fileName}</span>
                                            </div>
                                        </div>

                                        {/* Mobile Actions */}
                                        <div className="col-span-2 md:hidden flex justify-end">
                                            <button
                                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                                title="Expand"
                                                onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                                            >
                                                <Maximize2 className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Category */}
                                        <div className="col-span-3 hidden md:flex items-center">
                                            <span className="px-2.5 py-1 text-[11px] font-medium bg-gray-100 text-gray-600 rounded-full border border-gray-200">
                                                {doc.category}
                                            </span>
                                        </div>

                                        {/* Size */}
                                        <div className="col-span-2 hidden md:flex items-center text-gray-500 text-[13px]">
                                            {doc.size}
                                        </div>

                                        {/* Uploaded */}
                                        <div className="col-span-2 hidden md:flex items-center text-gray-500 text-[13px]">
                                            {doc.date}
                                        </div>

                                        {/* Actions */}
                                        <div className="col-span-1 hidden md:flex items-center justify-end gap-1 pr-2">
                                            <button className="p-1.5 text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded-md transition-all" title="View Document">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button className="p-1.5 text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded-md transition-all" title="More Options">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded View */}
                                    {expandedDoc === doc.id && (
                                        <div className="bg-gray-50/80 p-4 border-t border-gray-100 text-[13px]">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-2">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-400 mb-1.5 text-[11px] uppercase tracking-wider font-semibold">Description</span>
                                                    <span className="text-gray-700 leading-relaxed text-[13px]">Identity verification document standard file. Uploaded via mobile app.</span>
                                                </div>
                                                <div className="flex flex-col md:hidden">
                                                    <span className="text-gray-400 mb-1.5 text-[11px] uppercase tracking-wider font-semibold">Details</span>
                                                    <span className="text-gray-700">{doc.category} • {doc.size} • {doc.date}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-gray-400 mb-1.5 text-[11px] uppercase tracking-wider font-semibold">Tags</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        <span className="px-2 py-0.5 text-[11px] font-medium bg-white border border-gray-200 rounded-md text-gray-600 shadow-sm">official</span>
                                                        <span className="px-2 py-0.5 text-[11px] font-medium bg-white border border-gray-200 rounded-md text-gray-600 shadow-sm">verified</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col md:col-span-2 col-start-1 md:col-start-3 justify-end items-start md:items-end">
                                                    <div className="flex items-center gap-2 pt-2 md:pt-0 w-full md:w-auto">
                                                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors font-medium shadow-sm">
                                                            <Eye className="w-4 h-4" />
                                                            View
                                                        </button>
                                                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors font-medium shadow-sm">
                                                            <Download className="w-4 h-4" />
                                                            Download
                                                        </button>
                                                        <button className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors shadow-sm" title="Delete">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-[13px] text-gray-500 bg-gray-50/50">
                            <div>Showing 1 to 8 of 24 documents</div>
                            <div className="flex items-center gap-2">
                                <button className="p-1.5 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50" disabled>
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <div className="flex items-center gap-1">
                                    <button className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-gray-200 text-black font-medium shadow-sm">1</button>
                                    <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-200 transition-colors">2</button>
                                    <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-200 transition-colors">3</button>
                                </div>
                                <button className="p-1.5 rounded-md hover:bg-gray-200 transition-colors">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUpload={handleUpload}
            />
        </div>
    );
}
