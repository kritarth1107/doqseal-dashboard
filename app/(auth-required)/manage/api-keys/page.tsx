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
    BookOpen,
    X,
    ShieldCheck,
    Calendar,
    Infinity
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { useEffect, useCallback } from 'react';

interface ApiKeyData {
    _id: string;
    name: string;
    key: string; // This is the hint
    expiresAt?: string;
    createdAt: string;
    createdBy: {
        id: string;
        name: string;
        avatar?: string;
        email: string;
    };
}

const tabs = [
    { id: 'quickstart', label: 'Quickstart', icon: Terminal },
    { id: 'keys', label: 'Keys & Credits', icon: Key },
    { id: 'usage', label: 'Usage', icon: Activity },
    { id: 'integration', label: 'Integration', icon: Settings },
];

export default function ApiManagementPage() {
    const { activeOrgId } = useAuth();
    const [activeTab, setActiveTab] = useState('quickstart');
    const [showKey, setShowKey] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    
    // API Data state
    const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
    const [isLoadingKeys, setIsLoadingKeys] = useState(true);

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyExpiry, setNewKeyExpiry] = useState<string>(''); // empty string for null/never
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);

    // Mock data for credits (since we haven't implemented this yet)
    const creditsRemaining = 48500;
    const totalCredits = 50000;

    const fetchApiKeys = useCallback(async () => {
        if (!activeOrgId) return;
        
        setIsLoadingKeys(true);
        try {
            const response = await fetch(`/api/manage/api-keys/get?organisationId=${activeOrgId}`);
            const data = await response.json();
            
            if (response.ok) {
                setApiKeys(data.data || []);
            } else {
                toast.error(data.error || "Failed to load API keys");
            }
        } catch (error) {
            console.error("Fetch keys error:", error);
            toast.error("Error connecting to server");
        } finally {
            setIsLoadingKeys(false);
        }
    }, [activeOrgId]);

    useEffect(() => {
        fetchApiKeys();
    }, [fetchApiKeys]);

    const handleCopy = (text: string, id: string = 'default') => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleCreateKey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeOrgId) {
            toast.error("No active organisation selected");
            return;
        }
        
        setIsCreating(true);
        
        try {
            const response = await fetch('/api/manage/api-keys/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newKeyName,
                    organisationId: activeOrgId,
                    expiresInDays: newKeyExpiry || undefined
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setGeneratedKey(data.data.key || data.data.token || data.data); 
                toast.success("API key created successfully");
                fetchApiKeys(); // Refresh the list
            } else {
                toast.error(data.error || "Failed to create API key");
            }
        } catch (error) {
            console.error("Create API key error:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsCreating(false);
        }
    };

    const resetModal = () => {
        setShowCreateModal(false);
        setGeneratedKey(null);
        setNewKeyName('');
        setNewKeyExpiry('');
    };

    const renderQuickstart = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div>
                <h3 className="text-lg font-medium text-[#333] mb-2">Getting Started</h3>
                <p className="text-sm text-gray-500 max-w-3xl">
                    The DoqSeal API is organized around REST. Our API has predictable resource-oriented URLs, accepts form-encoded request bodies, returns JSON-encoded responses, and uses standard HTTP response codes, authentication, and verbs.
                </p>
            </div>

            <div className="bg-[#1f1f1f] rounded-xl overflow-hidden border border-gray-200 shadow-sm max-w-4xl">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/40">
                    <span className="text-xs font-medium text-gray-400">cURL</span>
                    <button className="text-gray-400 hover:text-white transition-colors">
                        <Copy className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-4 overflow-x-auto text-sm font-mono text-gray-300 leading-relaxed">
                    <span className="text-pink-500">curl</span> <span className="text-green-400">https://api.doqseal.io/v1/documents</span> \<br />
                    &nbsp;&nbsp;<span className="text-blue-400">-H</span> <span className="text-yellow-300">"Authorization: Bearer YOUR_API_KEY"</span> \<br />
                    &nbsp;&nbsp;<span className="text-blue-400">-d</span> <span className="text-yellow-300">query="show me all invoices"</span>
                </div>
            </div>

            <div className="bg-[#1f1f1f] rounded-xl overflow-hidden border border-gray-200 shadow-sm max-w-4xl">
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
                    response = requests.post(<span className="text-yellow-300">'https://api.doqseal.io/v1/documents'</span>, headers=headers)
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
                        <h3 className="text-lg font-medium text-[#333]">API Keys</h3>
                        <p className="text-sm text-gray-500">Manage your secret keys to authenticate requests.</p>
                    </div>
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-black bg-[#2563eb] hover:bg-[#1d4ed8] transition-colors rounded-xl shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Create new secret key
                    </button>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-transparent text-gray-500 dark:text-slate-500 text-xs uppercase font-medium border-b border-gray-100 dark:border-white/10">
                            <tr>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Secret Key</th>
                                <th className="px-6 py-3">Created</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoadingKeys ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
                                            <span className="text-xs text-gray-500 font-medium">Loading your keys...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : apiKeys.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="p-3 bg-gray-50 rounded-full">
                                                <Key className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <span className="text-xs text-gray-500 font-medium">No API keys found for this organisation</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                apiKeys.map((key) => (
                                    <tr key={key._id} className="group hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-[#333]">{key.name}</span>
                                                <span className="text-[10px] text-gray-400 font-normal">Created by {key.createdBy.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <code className="bg-gray-100 px-2.5 py-1.5 rounded-lg text-gray-700 font-mono text-[11px] border border-gray-200 shadow-inner">
                                                    {key.key}
                                                </code>
                                                <button 
                                                    onClick={() => handleCopy(key.key, key._id)} 
                                                    className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors hover:bg-white rounded-md"
                                                >
                                                    {copiedId === key._id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-500">{new Date(key.createdAt).toLocaleDateString()}</span>
                                                {key.expiresAt ? (
                                                    <span className="text-[10px] text-red-400 font-medium">Expires {new Date(key.expiresAt).toLocaleDateString()}</span>
                                                ) : (
                                                    <span className="text-[10px] text-green-400 font-medium flex items-center gap-1">
                                                        <Infinity className="w-2.5 h-2.5" /> Never expires
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-red-500 hover:text-red-600 text-xs font-semibold px-3 py-1.5 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                Revoke
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderUsage = () => (
        <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-[#333]">Usage Monitoring</h3>
                    <p className="text-sm text-gray-500">View your API request volume over the last 30 days.</p>
                </div>
                <select className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-[#333] outline-none shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
                    <option>Last 30 Days</option>
                    <option>Last 7 Days</option>
                    <option>Today</option>
                </select>
            </div>

            {/* Mock Chart Area */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 h-[300px] flex items-end justify-between gap-1 sm:gap-2 overflow-hidden relative shadow-sm">
                <div className="absolute top-6 left-6 flex flex-col gap-1">
                    <span className="text-2xl font-semibold text-[#333]">1,402</span>
                    <span className="text-xs text-gray-500">Total requests</span>
                </div>

                {/* Mock bars */}
                {[...Array(30)].map((_, i) => {
                    const height = Math.random() * 60 + 10; // random height 10-70%
                    return (
                        <div key={i} className="w-full bg-gray-100 rounded-t-sm hover:bg-[#2563eb] transition-colors group relative" style={{ height: `${height}%` }}>
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
                <h3 className="text-lg font-medium text-[#333]">Webhooks & Integrations</h3>
                <p className="text-sm text-gray-500">Configure webhooks to receive real-time updates when documents are processed.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center text-center py-12 shadow-sm">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Activity className="w-6 h-6 text-gray-400" />
                </div>
                <h4 className="text-base font-medium text-[#333] mb-2">No webhooks configured</h4>
                <p className="text-sm text-gray-500 max-w-sm mb-6">
                    Set up a webhook endpoint to receive notifications for events like <code>document.indexed</code> or <code>document.failed</code>.
                </p>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#333] bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-xl shadow-sm">
                    <Plus className="w-4 h-4" />
                    Add Webhook Endpoint
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                <div className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group shadow-sm bg-white">
                    <div className="flex items-start justify-between mb-2">
                        <BookOpen className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-gray-400 -translate-y-1 translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all" />
                    </div>
                    <h5 className="text-sm font-medium text-[#333] mb-1">API Documentation</h5>
                    <p className="text-xs text-gray-500 leading-relaxed">Read the full API reference to learn about all available endpoints and parameters.</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group shadow-sm bg-white">
                    <div className="flex items-start justify-between mb-2">
                        <Terminal className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-gray-400 -translate-y-1 translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all" />
                    </div>
                    <h5 className="text-sm font-medium text-[#333] mb-1">Client Libraries</h5>
                    <p className="text-xs text-gray-500 leading-relaxed">Download official SDKs for Node.js, Python, Ruby, and Go to speed up integration.</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto bg-[#f9f9f9] p-4 sm:p-8 custom-scrollbar">
            <div className="max-w-5xl mx-auto flex flex-col">

                {/* Header Section */}
                <div className="mb-8 mt-2 md:mt-0">
                    <h1 className="text-2xl sm:text-3xl font-semibold text-[#333] tracking-tight mb-2">API Management</h1>
                    <p className="text-gray-500 text-sm sm:text-base">
                        Integrate DoqSeal intelligence directly into your applications.
                    </p>
                </div>

                {/* Navigation Tabs */}
                <div className="flex overflow-x-auto custom-scrollbar border-b border-gray-200 mb-8 pb-px">
                    <div className="flex gap-6 min-w-max px-1">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-medium transition-all duration-200 whitespace-nowrap ${isActive
                                            ? "border-black text-black"
                                            : "border-transparent text-gray-500 hover:text-gray-800"
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? "text-black" : ""}`} />
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

            {/* Create API Key Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={resetModal} />
                    
                    <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-[#333]">
                                    {generatedKey ? 'Key Created' : 'Create secret key'}
                                </h3>
                                <button onClick={resetModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {generatedKey ? (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="p-4 bg-green-50 rounded-2xl flex items-start gap-3 border border-green-100">
                                        <ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-green-700 leading-relaxed">
                                            Please save this secret key somewhere safe. For security reasons, <strong>you won't be able to view it again</strong> through your dashboard.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                                            Secret Key
                                        </label>
                                        <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl p-3 font-mono text-sm">
                                            <span className="flex-1 truncate pr-10 text-gray-700">
                                                {generatedKey}
                                            </span>
                                            <button 
                                                onClick={() => handleCopy(generatedKey, 'modal')}
                                                className="absolute right-2 p-2 hover:bg-white rounded-lg transition-colors text-gray-500"
                                            >
                                                {copiedId === 'modal' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={resetModal}
                                        className="w-full py-3.5 bg-black text-white rounded-xl font-bold text-sm"
                                    >
                                        Done
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleCreateKey} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                                            Name
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            value={newKeyName}
                                            onChange={(e) => setNewKeyName(e.target.value)}
                                            placeholder="e.g. Production Environment"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-[#2563eb] outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                                            Expiry (Days)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={newKeyExpiry}
                                                onChange={(e) => setNewKeyExpiry(e.target.value)}
                                                placeholder="Leave empty for Never"
                                                className="w-full px-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-[#2563eb] outline-none transition-all"
                                            />
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                                {newKeyExpiry ? <Calendar className="w-4 h-4 text-gray-400" /> : <Infinity className="w-4 h-4 text-[#2563eb]" />}
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-500 px-1">
                                            {newKeyExpiry ? `Key will expire in ${newKeyExpiry} days.` : 'Key will never expire.'}
                                        </p>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button 
                                            type="button"
                                            onClick={resetModal}
                                            className="flex-1 py-3.5 border border-gray-200 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            disabled={isCreating || !newKeyName}
                                            type="submit"
                                            className="flex-1 py-3.5 bg-black text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isCreating ? 'Creating...' : 'Create Key'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
