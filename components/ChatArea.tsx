import React from "react";
import { Sparkles, ArrowUp, Link2, Paperclip, Send } from "lucide-react";

export function ChatArea() {
    return (
        <div className="flex-1 flex flex-col h-full relative">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-32">
                <div className="max-w-3xl mx-auto w-full flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 animate-pulse">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-semibold text-black tracking-tight">
                        How can I help you today?
                    </h1>
                    <p className="text-gray-500 max-w-md text-sm sm:text-base">
                        I'm a powerful AI assistant ready to help with writing, code, research, and analysis.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mt-8">
                        {[
                            "Analyze code structure",
                            "Draft an email to client",
                            "Plan a marketing campaign",
                            "Debug this React component"
                        ].map((suggestion, i) => (
                            <button
                                key={i}
                                className="text-left px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm text-gray-700 shadow-sm"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full p-4 sm:p-6 bg-gradient-to-t from-white via-white to-transparent">
                <div className="max-w-3xl mx-auto w-full">
                    <div className="relative flex items-center p-1 bg-white rounded-[24px] border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50 transition-shadow">
                        <button className="p-2 sm:p-3 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-100 shrink-0">
                            <Link2 className="w-5 h-5" />
                        </button>
                        <input
                            type="text"
                            placeholder="Message DoqSealAI..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-black px-2 py-3 outline-none text-[15px] placeholder-gray-400"
                        />
                        <button className="p-2 sm:p-3 mr-1 bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors rounded-full shrink-0 shadow-sm my-1">
                            <ArrowUp className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-3 hidden sm:block">
                        DoqSealAI can make mistakes. Verify important information.
                    </p>
                </div>
            </div>
        </div>
    );
}
