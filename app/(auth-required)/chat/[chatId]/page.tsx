"use client";
import React, { useState } from 'react';
import { Monitor, ArrowUp, Copy, ThumbsUp, ThumbsDown, RotateCcw, Link as LinkIcon, Plus, FileText, Share2, ShieldAlert, Settings, Trash2 } from 'lucide-react';
import Link from 'next/link';
import demoChatData from '@/utils/demo-chat.json';

// Helper for formatting markdown-like bold text
const FormattedText = ({ text }: { text: string }) => {
    // Very basic bold parsing for demo purposes **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <span className="whitespace-pre-wrap">
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="font-semibold text-black dark:text-white">{part.slice(2, -2)}</strong>;
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
};

export default function ChatPage({ params }: { params: { chatId: string } }) {
    const [query, setQuery] = useState("");
    const isTyping = query.trim().length > 0;

    // Using the imported JSON directly for rendering the chat timeline
    const chatData = demoChatData;

    return (
        <div className="flex-1 flex flex-col h-full bg-[#f9f9f9] dark:bg-[#1a1a1a] relative text-[#333] dark:text-[#ececec]">

            {/* Scrollable Chat Area */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-10 pt-8 pb-60 scroll-smooth w-full">
                <div className="max-w-4xl mx-auto flex flex-col gap-10">

                    {chatData.messages.map((msg) => (
                        <React.Fragment key={msg.message_id}>
                            {msg.role === 'user' ? (
                                /* User Message */
                                <div className="flex w-full justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="bg-[#2a2a2a] text-white dark:bg-[#2c2c2c] dark:text-white px-5 py-4 rounded-2xl max-w-[85%] sm:max-w-[75%] shadow-sm text-[15px] leading-relaxed break-words border border-transparent dark:border-white/5 font-sans">
                                        {msg.content.text}
                                    </div>
                                </div>
                            ) : (
                                /* AI Response Block */
                                <div className="flex flex-col w-full self-start animate-in fade-in slide-in-from-bottom-2 duration-500">

                                    {msg.content.type === 'composite' && msg.content.blocks?.map((block: any) => (
                                        <div key={block.block_id} className="mb-6 last:mb-0">

                                            {/* Text Block */}
                                            {block.type === 'text' && (
                                                <div className="text-[15px] leading-relaxed text-gray-800 dark:text-gray-200 font-serif">
                                                    <FormattedText text={block.text} />
                                                </div>
                                            )}

                                            {/* Document Table Block */}
                                            {block.type === 'document_table' && (
                                                <div className="w-full bg-white dark:bg-[#202020] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col my-4">
                                                    {/* Header */}
                                                    <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#262626]/50 flex items-center justify-between">
                                                        <span className="text-[14px] font-medium text-[#333] dark:text-[#ececec] flex items-center gap-2">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400 dark:text-gray-500">
                                                                <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                            Document Analysis
                                                        </span>
                                                        <span className="text-[12px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                                                            {block.summary?.total_found || block.rows.length} Results
                                                        </span>
                                                    </div>

                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left border-collapse min-w-[800px]">
                                                            <thead className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider bg-white dark:bg-[#202020] border-b border-gray-100 dark:border-white/5">
                                                                <tr>
                                                                    <th className="py-3 px-5 whitespace-nowrap w-12">#</th>
                                                                    <th className="py-3 px-4 whitespace-nowrap">Document</th>
                                                                    <th className="py-3 px-4 whitespace-nowrap">Type</th>
                                                                    <th className="py-3 px-4 whitespace-nowrap">Issued By</th>
                                                                    <th className="py-3 px-4">Address</th>
                                                                    <th className="py-3 px-4 whitespace-nowrap">Valid Until</th>
                                                                    <th className="py-3 px-5 text-right whitespace-nowrap">Action</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="text-[13px] font-sans divide-y divide-gray-100 dark:divide-white/5">
                                                                {block.rows.map((row: any) => (
                                                                    <tr key={row.document_id} className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors overflow-hidden">
                                                                        <td className="py-3 px-5 text-gray-400 dark:text-gray-500 font-medium align-middle">{row.index}</td>
                                                                        <td className="py-3 px-4 align-middle">
                                                                            <span className="font-medium flex items-center gap-2 text-[#333] dark:text-[#ececec] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                                                <span className="text-base leading-none">{row.type_icon}</span>
                                                                                {row.document}
                                                                            </span>
                                                                        </td>
                                                                        <td className="py-3 px-4 align-middle">
                                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${row.type === 'Identity'
                                                                                ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20'
                                                                                : row.type === 'Financial' || row.type === 'Tax'
                                                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                                                                    : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                                                                }`}>
                                                                                {row.type}
                                                                            </span>
                                                                        </td>
                                                                        <td className="py-3 px-4 align-middle text-gray-600 dark:text-gray-300">{row.issued_by}</td>
                                                                        <td className="py-3 px-4 align-middle text-gray-500 dark:text-gray-400 max-w-[200px] leading-snug">
                                                                            <span className="truncate block" title={row.address}>{row.address}</span>
                                                                            {row.status?.variant === 'warning' && (
                                                                                <span className="inline-block mt-1 text-[10px] text-amber-600 dark:text-amber-500 font-medium bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                                                                    {row.status.label}
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td className="py-3 px-4 align-middle text-gray-600 dark:text-gray-300">
                                                                            {row.expiry || '—'}
                                                                        </td>
                                                                        <td className="py-3 px-5 align-middle text-right">
                                                                            <button className="inline-flex items-center justify-center px-3 py-1.5 text-[12px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-[#2c2c2c] dark:text-gray-200 dark:border-white/10 dark:hover:bg-white/10 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-[#202020] focus:ring-gray-300 dark:focus:ring-gray-600 shrink-0">
                                                                                {row.action.label.replace('→', '')} <span className="ml-1 opacity-70">→</span>
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Shareable Link Block */}
                                            {block.type === 'shareable_link' && (
                                                <div className="w-full max-w-xl bg-white dark:bg-[#202020] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col my-2">

                                                    {/* Card Header */}
                                                    <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#262626]/50 flex items-start justify-between">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <LinkIcon className="w-4 h-4 text-emerald-500" />
                                                                <h3 className="text-[15px] font-medium text-[#333] dark:text-[#ececec]">Secure Share Link active</h3>
                                                            </div>
                                                            <p className="text-[13px] text-gray-500 dark:text-gray-400">For <strong>{block.document_name}</strong></p>
                                                        </div>
                                                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                                                            Active
                                                        </span>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="p-5 flex flex-col gap-6">

                                                        {/* Link Box */}
                                                        <div className="flex flex-col gap-2">
                                                            <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">Shareable URL</span>
                                                            <div className="flex items-center justify-between text-[#333] dark:text-[#ececec] bg-[#f5f5f5] dark:bg-[#1a1a1a] p-3 rounded-xl border border-gray-200 dark:border-white/5 shadow-inner">
                                                                <span className="text-[14px] font-medium truncate pr-4">
                                                                    {block.short_link}
                                                                </span>
                                                                <button className="p-2 text-gray-500 hover:text-black dark:hover:text-white dark:hover:bg-[#2c2c2c] rounded-lg bg-white dark:bg-[#282828] transition-colors border border-gray-200 shadow-sm dark:border-white/10 shrink-0" title="Copy Link">
                                                                    <Copy className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Metadata Settings Grid */}
                                                        <div className="flex items-center gap-8 text-[13px] text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-white/[0.02] p-4 rounded-xl border border-gray-100 dark:border-white/5">
                                                            <div className="flex flex-col gap-1.5">
                                                                <span className="text-[11px] uppercase tracking-wider font-semibold opacity-70">Expires In</span>
                                                                <span className="font-medium text-gray-800 dark:text-gray-200">{block.settings.expires_in}</span>
                                                            </div>
                                                            <div className="flex flex-col gap-1.5">
                                                                <span className="text-[11px] uppercase tracking-wider font-semibold opacity-70">Views</span>
                                                                <span className="font-medium text-gray-800 dark:text-gray-200">{block.settings.views_used} / {block.settings.max_views}</span>
                                                            </div>
                                                            <div className="flex flex-col gap-1.5">
                                                                <span className="text-[11px] uppercase tracking-wider font-semibold opacity-70">Watermark</span>
                                                                <span className="font-medium text-gray-800 dark:text-gray-200">{block.settings.watermark ? 'Yes' : 'No'}</span>
                                                            </div>
                                                        </div>

                                                        {/* Warning Alert */}
                                                        {block.warning && (
                                                            <div className="flex items-start gap-3 bg-amber-50 dark:bg-[#332a15] border border-amber-200 dark:border-amber-700/50 p-3.5 rounded-xl">
                                                                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                                                <p className="text-[13px] text-amber-800 dark:text-amber-200/90 leading-snug">{block.warning.message}</p>
                                                            </div>
                                                        )}

                                                        {/* Bottom Actions */}
                                                        <div className="flex flex-wrap items-center gap-2 pt-1">
                                                            {block.actions.map((action: any, i: number) => {
                                                                if (action.type === 'copy_link') return null; // Already rendered inline
                                                                return (
                                                                    <button key={i} className={`flex items-center gap-2 px-3 py-2 text-[12px] font-medium rounded-lg transition-colors shadow-sm ${action.type === 'revoke_link'
                                                                        ? 'text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 dark:text-red-400 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:border-red-500/20'
                                                                        : 'text-gray-600 dark:text-gray-300 bg-white dark:bg-[#2c2c2c] border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
                                                                        }`}>
                                                                        {action.type === 'share_whatsapp' && <Share2 className="w-3.5 h-3.5" />}
                                                                        {action.type === 'edit_link_settings' && <Settings className="w-3.5 h-3.5" />}
                                                                        {action.type === 'revoke_link' && <Trash2 className="w-3.5 h-3.5" />}
                                                                        {action.label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    ))}

                                    {/* AI Action Buttons - Rendered once at the end of the AI Message Array */}
                                    <div className="flex items-center gap-3 mt-1 mb-2 text-gray-400 dark:text-gray-500">
                                        <button className="p-1.5 hover:text-black dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-white/10 rounded-md transition-colors" title="Copy">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <button className="p-1.5 hover:text-black dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-white/10 rounded-md transition-colors" title="Good response">
                                            <ThumbsUp className="w-4 h-4" />
                                        </button>
                                        <button className="p-1.5 hover:text-black dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-white/10 rounded-md transition-colors" title="Bad response">
                                            <ThumbsDown className="w-4 h-4" />
                                        </button>
                                        <button className="p-1.5 hover:text-black dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-white/10 rounded-md transition-colors" title="Regenerate">
                                            <RotateCcw className="w-4 h-4" />
                                        </button>
                                    </div>

                                </div>
                            )}
                        </React.Fragment>
                    ))}

                </div>
            </div>

            {/* Bottom Sticky Input Container */}
            <div className="absolute bottom-0 w-full bg-gradient-to-t from-[#f9f9f9] via-[#f9f9f9] dark:from-[#1a1a1a] dark:via-[#1a1a1a] to-transparent pt-10 pb-6">
                <div className="max-w-4xl mx-auto w-full flex flex-col items-center">

                    <div className="w-full bg-white dark:bg-[#2c2c2c] rounded-2xl border border-gray-200 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] overflow-hidden flex flex-col focus-within:ring-1 focus-within:ring-gray-300 dark:focus-within:ring-gray-500 transition-all font-sans">
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-0 text-[#333] dark:text-[#ececec] px-4 py-4 outline-none text-[15px] placeholder-gray-400 dark:placeholder-gray-500 resize-none min-h-[90px] max-h-[300px]"
                            placeholder="Reply..."
                        />
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50 dark:bg-black/10 border-t border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-2">
                                <button className="p-1.5 text-gray-400 hover:text-black dark:hover:text-white transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-white/10" title="Attach file">
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                <button className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-500 hover:text-black dark:hover:text-white transition-colors">
                                    Sakshya AI
                                </button>

                                {/* Voice / Send Button Toggle */}
                                <div className="relative w-[32px] h-[32px]">
                                    <button
                                        className={`absolute inset-0 flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white transition-all duration-300 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 ${isTyping ? 'opacity-0 scale-50 rotate-[-90deg] pointer-events-none' : 'opacity-100 scale-100 rotate-0'
                                            }`}
                                        title="Voice Input"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 13a2 2 0 0 0 2-2V7a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0V4a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0v-4a2 2 0 0 1 2-2" /></svg>
                                    </button>
                                    <button
                                        className={`absolute inset-0 flex items-center justify-center bg-black dark:bg-white text-white dark:text-black transition-all duration-300 rounded-lg shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 ${isTyping ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-90 pointer-events-none'
                                            }`}
                                        title="Send Message"
                                    >
                                        <ArrowUp className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subtle Disclosure Footer */}
                    <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-3 text-center tracking-wide font-sans">
                        Sakshya is AI and can make mistakes. Please double-check responses.
                    </div>

                </div>
            </div>

        </div>
    );
}
