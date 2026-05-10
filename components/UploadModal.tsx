import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, File, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (files: File[]) => void;
}

export function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [agreedToDPA, setAgreedToDPA] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length > 0) {
            setSelectedFiles((prev) => [...prev, ...droppedFiles]);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setSelectedFiles((prev) => [...prev, ...newFiles]);
        }
    };

    const removeFile = (indexToRemove: number) => {
        setSelectedFiles(files => files.filter((_, idx) => idx !== indexToRemove));
    };

    const handleUploadClick = () => {
        if (!agreedToDPA || selectedFiles.length === 0) return;
        onUpload(selectedFiles);
        // Reset state
        setSelectedFiles([]);
        setAgreedToDPA(false);
        onClose();
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <h2 className="text-xl font-semibold text-[#333]">Upload Documents</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">

                    {/* Drag & Drop Zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ease-in-out
                            ${isDragging
                                ? 'border-[#2563eb] bg-[#2563eb]/5
                                : 'border-gray-300 hover:bg-gray-50
                            }
                        `}
                    >
                        <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.csv"
                        />
                        <div className={`p-4 rounded-full mb-4 ${isDragging ? 'bg-[#2563eb]/20 text-black' : 'bg-gray-100 text-gray-500
                            <UploadCloud className="w-8 h-8" />
                        </div>
                        <p className="text-[#333] font-medium mb-1 text-center">
                            Click to upload <span className="text-gray-500 font-normal">or drag and drop</span>
                        </p>
                        <p className="text-xs text-gray-500 text-center">
                            PDF, PNG, JPG, or CSV (max. 20MB)
                        </p>
                    </div>

                    {/* File Previews List */}
                    {selectedFiles.length > 0 && (
                        <div className="mt-6 flex flex-col gap-3">
                            <h3 className="text-sm font-medium text-gray-700">Selected Files ({selectedFiles.length})</h3>
                            <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                                {selectedFiles.map((file, index) => (
                                    <div
                                        key={`${file.name}-${index}`}
                                        className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl group"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-blue-50 text-blue-500 rounded-lg shrink-0">
                                                <File className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col truncate">
                                                <span className="text-sm font-medium text-[#333] truncate">
                                                    {file.name}
                                                </span>
                                                <span className="text-xs text-gray-500 flex items-center gap-2">
                                                    {formatFileSize(file.size)} • {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFile(index);
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                            title="Remove file"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* DPA Agreement */}
                    <div className="mt-8 flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center h-5 mt-0.5">
                            <input
                                id="dpa-agreement"
                                type="checkbox"
                                checked={agreedToDPA}
                                onChange={(e) => setAgreedToDPA(e.target.checked)}
                                className="w-4 h-4 text-black bg-white border-gray-300 rounded focus:ring-black cursor-pointer accent-black"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="dpa-agreement" className="text-sm font-medium text-[#333] cursor-pointer">
                                Data Processing Agreement
                            </label>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                By uploading these documents, you agree to our <a href="#" className="underline hover:text-black">terms of service</a> and explicitly consent to our automated data processing pipeline to extract, index, and organize the contents according to our DPA.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUploadClick}
                        disabled={selectedFiles.length === 0 || !agreedToDPA}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-[#2563eb] hover:bg-[#1d4ed8] transition-colors rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {agreedToDPA && selectedFiles.length > 0 && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                        Process Upload
                    </button>
                </div>
            </div>
        </div>
    );
}
