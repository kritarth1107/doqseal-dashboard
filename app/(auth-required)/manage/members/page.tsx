"use client";
import React, { useState } from 'react';
import {
    Users,
    Globe,
    Shield,
    MoreVertical,
    Search,
    Mail,
    Plus,
    ExternalLink,
    CheckCircle2,
    ShieldCheck,
    UserPlus,
    AtSign,
    ArrowRight
} from 'lucide-react';

const tabs = [
    { id: 'members', label: 'Team Members', icon: Users },
    { id: 'domains', label: 'Domain Access', icon: Globe },
];

export default function MembersManagementPage() {
    const [activeTab, setActiveTab] = useState('members');
    const [searchQuery, setSearchQuery] = useState('');
    const [autoJoin, setAutoJoin] = useState(true);
    const [domain, setDomain] = useState('doqseal.io');

    const members = [
        { id: 1, name: "Kritarth Singhal", email: "kritarth@doqseal.io", role: "Owner", status: "Active", avatar: "KS" },
        { id: 2, name: "Mad Max", email: "m4dm4x@doqseal.io", role: "Admin", status: "Active", avatar: "MM" },
        { id: 3, name: "Sarah Connor", email: "sarah.c@terminator.com", role: "Member", status: "Invited", avatar: "SC" },
        { id: 4, name: "Tony Stark", email: "tony@starkindustries.com", role: "Viewer", status: "Active", avatar: "TS" },
    ];

    const renderMembers = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative w-full sm:w-96 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#2563eb] transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search members by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-1 focus:ring-[#2563eb] transition-all"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#2563eb] hover:bg-[#1d4ed8] transition-colors rounded-xl shadow-sm whitespace-nowrap">
                    <UserPlus className="w-4 h-4" />
                    Invite Member
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200">
                            <th className="px-6 py-4">Member</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {members.map((member) => (
                            <tr key={member.id} className="group hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2563eb] to-[#3b82f6] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                            {member.avatar}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-[#333]">{member.name}</span>
                                            <span className="text-xs text-gray-500">{member.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5">
                                        <Shield className={`w-3.5 h-3.5 ${member.role === 'Owner' || member.role === 'Admin' ? 'text-[#2563eb]' : 'text-gray-400'}`} />
                                        <span className="text-xs font-medium text-gray-600">{member.role}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5">
                                        {member.status === 'Active' ? (
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        ) : (
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                        )}
                                        <span className={`text-xs font-medium ${member.status === 'Active' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {member.status}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-1.5 text-gray-400 hover:text-black transition-colors">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderDomains = () => (
        <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm relative overflow-hidden group">
                {/* Background Decoration */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#2563eb]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#2563eb]/10 transition-all duration-700" />
                
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-14 h-14 rounded-2xl bg-[#2563eb]/10 flex items-center justify-center shrink-0">
                        <Globe className="w-7 h-7 text-[#2563eb]" />
                    </div>
                    <div className="flex-1 space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold text-[#333] mb-2">Domain-based Auto-Access</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Streamline your team's onboarding by allowing anyone with a specific email domain to automatically join your workspace. New users will be granted immediate access as team members.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Authorized Domain</label>
                                <div className="relative">
                                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input 
                                        type="text" 
                                        value={domain}
                                        onChange={(e) => setDomain(e.target.value)}
                                        placeholder="e.g. doqseal.io"
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#2563eb] transition-all font-medium"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Default Member Role</label>
                                <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Member</span>
                                    <ShieldCheck className="w-4 h-4 text-[#2563eb]" />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-[#2563eb]/5 rounded-2xl border border-[#2563eb]/20">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-[#2563eb]" />
                                <div>
                                    <p className="text-sm font-semibold text-[#333]">Enable auto-registration</p>
                                    <p className="text-xs text-gray-500">Allow users with @{domain} to join instantly.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setAutoJoin(!autoJoin)}
                                className={`w-12 h-6 rounded-full transition-all duration-300 relative ${autoJoin ? 'bg-[#2563eb]' : 'bg-gray-300'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${autoJoin ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="pt-2">
                            <button className="px-6 py-2.5 text-sm font-medium text-white bg-[#2563eb] rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-[#2563eb]/10 flex items-center gap-2">
                                Save Configuration
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                </div>
                <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-blue-900">Secure by default</h4>
                    <p className="text-xs text-blue-700 leading-relaxed">
                        Domain-based access only applies to users who verify their email ownership. Administrators still retain full control to revoke access at any time from the Team Members list.
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto bg-[#f9f9f9] p-4 sm:p-8 custom-scrollbar pt-20">
            <div className="max-w-5xl mx-auto flex flex-col">
                
                {/* Header Section */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#2563eb]/10 rounded-lg">
                            <Users className="w-5 h-5 text-[#2563eb]" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-semibold text-[#333] tracking-tight">Members & Access</h1>
                    </div>
                    <p className="text-gray-500 text-sm sm:text-base max-w-2xl">
                        Manage your team's workspace permissions and configure automatic onboarding rules for your organization.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto custom-scrollbar border-b border-gray-200 mb-8 pb-px">
                    <div className="flex gap-8 min-w-max px-1">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 pb-4 px-1 border-b-2 text-sm font-medium transition-all duration-200 whitespace-nowrap ${isActive
                                            ? "border-black text-black"
                                            : "border-transparent text-gray-500 hover:text-gray-800"
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#2563eb]' : ''}`} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="pb-32">
                    {activeTab === 'members' && renderMembers()}
                    {activeTab === 'domains' && renderDomains()}
                </div>

            </div>
        </div>
    );
}