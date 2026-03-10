"use client";
import React, { useState } from 'react';
import {
    Key,
    Terminal,
    Activity,
    Settings,
    Copy,
    Check,
    Plus,
    Eye,
    EyeOff,
    ExternalLink,
    BookOpen
} from 'lucide-react';

const tabs = [
    { id: 'quickstart', label: 'Quickstart', icon: Terminal },
    { id: 'keys', label: 'Keys & Credits', icon: Key },
    { id: 'usage', label: 'Usage', icon: Activity },
    { id: 'integration', label: 'Integration', icon: Settings },
];

export default function ApiManagementPage() {
    const [activeTab, setActiveTab] = useState('quickstart');
    const [showKey, setShowKey] = useState(false);
    const [copied, setCopied] = useState(false);

    // Mock data
    const apiKey = "sk_sakshya_live_7x9f...8a2b";
    const fullApiKey = "sk_sakshya_live_7x9f4m2n8q1p5r3t6v9w8a2b";
    const creditsRemaining = 48500;
    const totalCredits = 50000;

    const handleCopy = () => {
        navigator.clipboard.writeText(fullApiKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const renderQuickstart = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div>
                <h3 className="text-lg font-medium text-[#333] dark:text-[#ececec] mb-2">Getting Started</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-3xl">
                    The Sakshya API is organized around REST. Our API has predictable resource-oriented URLs, accepts form-encoded request bodies, returns JSON-encoded responses, and uses standard HTTP response codes, authentication, and verbs.
                </p>
            </div>

            <div className="bg-[#1f1f1f] rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm max-w-4xl">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/40">
                    <span className="text-xs font-medium text-gray-400">cURL</span>
                    <button className="text-gray-400 hover:text-white transition-colors">
                        <Copy className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-4 overflow-x-auto text-sm font-mono text-gray-300 leading-relaxed">
                    <span className="text-pink-500">curl</span> <span className="text-green-400">https://api.sakshya.io/v1/documents</span> \<br />
                    &nbsp;&nbsp;<span className="text-blue-400">-H</span> <span className="text-yellow-300">"Authorization: Bearer YOUR_API_KEY"</span> \<br />
                    &nbsp;&nbsp;<span className="text-blue-400">-d</span> <span className="text-yellow-300">query="show me all invoices"</span>
                </div>
            </div>

            <div className="bg-[#1f1f1f] rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm max-w-4xl">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/40">
                    <span className="text-xs font-medium text-gray-400">Python</span>
                    <button className="text-gray-400 hover:text-white transition-colors">
                        <Copy className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-4 overflow-x-auto text-sm font-mono text-gray-300 leading-relaxed">
                    <span className="text-purple-400">import</span> requests<br /><br />
                    headers = {"{"}<br />
                    &nbsp;&nbsp;<span className="text-yellow-300">'Authorization'</span>: <span className="text-yellow-300">f'Bearer <span className="text-blue-400">{"{YOUR_API_KEY}"}</span>'</span>,<br />
                    {"}"}<br /><br />
                    response = requests.post(<span className="text-yellow-300">'https://api.sakshya.io/v1/documents'</span>, headers=headers)
                </div>
            </div>
        </div>
    );

    const renderKeysAndCredits = () => (
        <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl">
            {/* API Keys Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium text-[#333] dark:text-[#ececec]">API Keys</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your secret keys to authenticate requests.</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-black bg-[#D4F46A] hover:bg-[#cbf046] transition-colors rounded-xl shadow-sm">
                        <Plus className="w-4 h-4" />
                        Create new secret key
                    </button>
                </div>

                <div className="bg-white dark:bg-[#2c2c2c] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-black/20 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">
                            <tr>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Secret Key</th>
                                <th className="px-6 py-3">Created</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            <tr className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-medium text-[#333] dark:text-[#ececec]">Default Project Key</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <code className="bg-gray-100 dark:bg-black/30 px-2 py-1 rounded text-gray-700 dark:text-gray-300 font-mono text-xs">
                                            {showKey ? fullApiKey : apiKey}
                                        </code>
                                        <button onClick={() => setShowKey(!showKey)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                                            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        <button onClick={handleCopy} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500">Oct 24, 2024</td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-red-500 hover:text-red-600 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                        Revoke
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="h-px w-full bg-gray-200 dark:bg-white/10" />

            {/* Credits Section */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-medium text-[#333] dark:text-[#ececec]">Credits & Billing</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Monitor your API usage credits for the current billing cycle.</p>
                </div>

                <div className="bg-white dark:bg-[#2c2c2c] rounded-xl border border-gray-200 dark:border-white/10 p-6 flex flex-col md:flex-row gap-8 items-center shadow-sm">
                    <div className="flex-1 w-full">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <span className="text-3xl font-semibold text-[#333] dark:text-[#ececec]">{creditsRemaining.toLocaleString()}</span>
                                <span className="text-gray-500 dark:text-gray-400 ml-2">/ {totalCredits.toLocaleString()} credits</span>
                            </div>
                            <span className="text-sm font-medium text-green-500 bg-green-50 dark:bg-green-500/10 px-2.5 py-1 rounded-full">Active</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-3 bg-gray-100 dark:bg-black/30 rounded-full overflow-hidden mt-4">
                            <div
                                className="h-full bg-[#D4F46A] rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${((totalCredits - creditsRemaining) / totalCredits) * 100}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                            <span>{totalCredits - creditsRemaining} used</span>
                            <span>Resets in 12 days</span>
                        </div>
                    </div>

                    <div className="w-full md:w-auto flex flex-col gap-3">
                        <button className="w-full px-6 py-2.5 text-sm font-medium text-[#333] dark:text-[#ececec] bg-white dark:bg-[#333] border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors rounded-xl shadow-sm whitespace-nowrap">
                            Buy more credits
                        </button>
                        <button className="w-full px-6 py-2.5 text-sm font-medium text-gray-500 bg-transparent hover:bg-gray-50 dark:hover:bg-white/5 transition-colors rounded-xl whitespace-nowrap">
                            Billing settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderUsage = () => (
        <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-[#333] dark:text-[#ececec]">Usage Monitoring</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">View your API request volume over the last 30 days.</p>
                </div>
                <select className="bg-white dark:bg-[#2c2c2c] border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm text-[#333] dark:text-[#ececec] outline-none shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <option>Last 30 Days</option>
                    <option>Last 7 Days</option>
                    <option>Today</option>
                </select>
            </div>

            {/* Mock Chart Area */}
            <div className="bg-white dark:bg-[#2c2c2c] rounded-xl border border-gray-200 dark:border-white/10 p-6 h-[300px] flex items-end justify-between gap-1 sm:gap-2 overflow-hidden relative shadow-sm">
                <div className="absolute top-6 left-6 flex flex-col gap-1">
                    <span className="text-2xl font-semibold text-[#333] dark:text-[#ececec]">1,402</span>
                    <span className="text-xs text-gray-500">Total requests</span>
                </div>

                {/* Mock bars */}
                {[...Array(30)].map((_, i) => {
                    const height = Math.random() * 60 + 10; // random height 10-70%
                    return (
                        <div key={i} className="w-full bg-gray-100 dark:bg-white/5 rounded-t-sm hover:bg-[#D4F46A] dark:hover:bg-[#D4F46A] transition-colors group relative" style={{ height: `${height}%` }}>
                            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-10 transition-opacity">
                                {Math.floor(height * 20)} requests
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );

    const renderIntegration = () => (
        <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
            <div>
                <h3 className="text-lg font-medium text-[#333] dark:text-[#ececec]">Webhooks & Integrations</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Configure webhooks to receive real-time updates when documents are processed.</p>
            </div>

            <div className="bg-white dark:bg-[#2c2c2c] rounded-xl border border-gray-200 dark:border-white/10 p-6 flex flex-col items-center justify-center text-center py-12 shadow-sm">
                <div className="w-12 h-12 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center mb-4">
                    <Activity className="w-6 h-6 text-gray-400" />
                </div>
                <h4 className="text-base font-medium text-[#333] dark:text-[#ececec] mb-2">No webhooks configured</h4>
                <p className="text-sm text-gray-500 max-w-sm mb-6">
                    Set up a webhook endpoint to receive notifications for events like <code>document.indexed</code> or <code>document.failed</code>.
                </p>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#333] dark:text-[#ececec] bg-white dark:bg-[#333] border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors rounded-xl shadow-sm">
                    <Plus className="w-4 h-4" />
                    Add Webhook Endpoint
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                <div className="p-4 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group shadow-sm bg-white dark:bg-[#2c2c2c]">
                    <div className="flex items-start justify-between mb-2">
                        <BookOpen className="w-5 h-5 text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-gray-400 -translate-y-1 translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all" />
                    </div>
                    <h5 className="text-sm font-medium text-[#333] dark:text-[#ececec] mb-1">API Documentation</h5>
                    <p className="text-xs text-gray-500 leading-relaxed">Read the full API reference to learn about all available endpoints and parameters.</p>
                </div>
                <div className="p-4 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group shadow-sm bg-white dark:bg-[#2c2c2c]">
                    <div className="flex items-start justify-between mb-2">
                        <Terminal className="w-5 h-5 text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-gray-400 -translate-y-1 translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all" />
                    </div>
                    <h5 className="text-sm font-medium text-[#333] dark:text-[#ececec] mb-1">Client Libraries</h5>
                    <p className="text-xs text-gray-500 leading-relaxed">Download official SDKs for Node.js, Python, Ruby, and Go to speed up integration.</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto bg-[#f9f9f9] dark:bg-[#1f1f1f] p-4 sm:p-8 custom-scrollbar">
            <div className="max-w-5xl mx-auto flex flex-col">

                {/* Header Section */}
                <div className="mb-8 mt-2 md:mt-0">
                    <h1 className="text-2xl sm:text-3xl font-semibold text-[#333] dark:text-[#ececec] tracking-tight mb-2">API Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                        Integrate Sakshya intelligence directly into your applications.
                    </p>
                </div>

                {/* Navigation Tabs */}
                <div className="flex overflow-x-auto custom-scrollbar border-b border-gray-200 dark:border-white/10 mb-8 pb-px">
                    <div className="flex gap-6 min-w-max px-1">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-medium transition-all duration-200 whitespace-nowrap ${isActive
                                            ? "border-black dark:border-[#D4F46A] text-black dark:text-white"
                                            : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-black dark:text-[#D4F46A]' : ''}`} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content Area */}
                <div className="pb-24">
                    {activeTab === 'quickstart' && renderQuickstart()}
                    {activeTab === 'keys' && renderKeysAndCredits()}
                    {activeTab === 'usage' && renderUsage()}
                    {activeTab === 'integration' && renderIntegration()}
                </div>

            </div>
        </div>
    );
}
