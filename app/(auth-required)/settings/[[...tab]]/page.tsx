"use client";
import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Settings as SettingsIcon, Monitor, Sun, Moon, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/components/AuthProvider';
import { BillingSettings } from '@/components/settings/BillingSettings';
import { AccountSettings } from '@/components/settings/AccountSettings';

const SETTINGS_TABS = [
    { id: 'general', label: 'General', path: '/settings' },
    { id: 'account', label: 'Account', path: '/settings/account' },
    { id: 'privacy', label: 'Privacy', path: '/settings/privacy' },
    { id: 'billing', label: 'Billing', path: '/settings/billing' },
];

export default function SettingsPage() {
    const router = useRouter();
    const params = useParams();

    // Extract tab from catch-all route params
    const tabArray = params.tab as string[] | undefined;
    const activeTabId = tabArray && tabArray.length > 0 ? tabArray[0] : 'general';

    // Toggle state
    const [responseCompletions, setResponseCompletions] = useState(true);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const { userData } = useAuth();

    // Wait for mount to avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true);
    }, []);

    // For initial render before hydration, default to system or what's safest text-wise
    const currentTheme = mounted ? theme : 'system';

    return (
        <div className="flex-1 flex flex-col h-full bg-[#f9f9f9] dark:bg-[#0b1220] overflow-hidden text-[#333] dark:text-slate-100 font-sans">
            <div className="flex-1 overflow-y-auto w-full">
                <div className="max-w-[1000px] mx-auto px-6 py-12 flex flex-col md:flex-row gap-12">

                    {/* Settings Sidebar */}
                    <div className="w-full md:w-56 shrink-0 flex flex-col gap-6">
                        <h1 className="text-xl font-medium tracking-tight px-3">Settings</h1>
                        <nav className="flex flex-col space-y-0.5">
                            {SETTINGS_TABS.map((tab) => {
                                const isActive = activeTabId === tab.id;
                                return (
                                    <Link
                                        key={tab.id}
                                        href={tab.path}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                            ? "bg-blue-50 dark:bg-blue-950/50 text-[#2563eb]"
                                            : "text-gray-600 dark:text-slate-400 hover:bg-gray-200/50 dark:hover:bg-zinc-800/60 hover:text-gray-900 dark:hover:text-slate-100"
                                            }`}
                                    >
                                        {tab.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Settings Content Area */}
                    <div className="flex-1 w-full max-w-3xl min-w-0 pb-20">
                        {activeTabId === 'general' && (
                            <div className="flex flex-col gap-12 animate-in fade-in duration-300">

                                {/* Profile Section */}
                                <section className="flex flex-col gap-5">
                                    <h2 className="text-base font-semibold text-black dark:text-slate-100 border-b border-gray-200 dark:border-zinc-800 pb-2">Profile</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Full name</label>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#e3d5c8] text-[#5c4a3d] flex items-center justify-center font-semibold shrink-0 overflow-hidden">
                                                    {userData?.avatar ? (
                                                        <img src={userData.avatar} alt={userData.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        userData?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    defaultValue={userData?.name}
                                                    className="flex-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-shadow"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Email address</label>
                                            <input
                                                type="text"
                                                disabled
                                                defaultValue={userData?.email}
                                                className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-shadow disabled:opacity-70"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 mt-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300">What best describes your work?</label>
                                        <div className="relative">
                                            <select className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-shadow text-gray-500 dark:text-slate-300 cursor-pointer">
                                                <option value="" disabled selected>Select your work function</option>
                                                <option value="engineering">Engineering</option>
                                                <option value="product">Product Management</option>
                                                <option value="design">Design</option>
                                                <option value="marketing">Marketing</option>
                                                <option value="other">Other</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 mt-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300 flex flex-col gap-1">
                                            <span>What <span className="underline decoration-dashed underline-offset-4 decoration-gray-400">personal preferences</span> should DoqSeal consider in responses?</span>
                                            <span className="text-xs text-gray-500 dark:text-slate-400 font-normal">Your preferences will apply to all conversations, within <a href="#" className="underline">DoqSeal&apos;s guidelines</a>.</span>
                                        </label>
                                        <textarea
                                            placeholder="e.g. when learning new concepts, I find analogies particularly helpful"
                                            className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-slate-100 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-shadow min-h-[100px] resize-y placeholder-gray-400"
                                        />
                                    </div>
                                </section>

                                {/* Notifications Section */}
                                <section className="flex flex-col gap-5">
                                    <h2 className="text-base font-semibold text-black dark:text-slate-100 border-b border-gray-200 dark:border-zinc-800 pb-2">Notifications</h2>

                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-medium text-black dark:text-slate-100">Response completions</span>
                                            <span className="text-[13px] text-gray-500 dark:text-slate-400">Get notified when DoqSeal has finished a response. Most useful for long-running tasks like tool calls and Research.</span>
                                        </div>
                                        {/* Toggle Switch */}
                                        <button
                                            onClick={() => setResponseCompletions(!responseCompletions)}
                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none transition-colors ${responseCompletions ? "bg-blue-500" : "bg-gray-300 dark:bg-zinc-600"}`}
                                        >
                                            <span className="sr-only">Toggle response completions</span>
                                            <span
                                                className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${responseCompletions ? 'translate-x-[8px]' : '-translate-x-[8px]'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                </section>

                                {/* Appearance Section */}
                                <section className="flex flex-col gap-5">
                                    <h2 className="text-base font-semibold text-black dark:text-slate-100 border-b border-gray-200 dark:border-zinc-800 pb-2">Appearance</h2>

                                    <div className="flex flex-col gap-3">
                                        <span className="text-sm font-medium text-black dark:text-slate-100">Color mode</span>
                                        <p className="text-[13px] text-gray-500 dark:text-slate-400 -mt-1">
                                            Choose light, dark, or match your device setting.
                                        </p>
                                        <div className="flex flex-wrap gap-4">

                                            {/* Light Mode */}
                                            <button
                                                type="button"
                                                onClick={() => setTheme('light')}
                                                className="flex flex-col items-center gap-2 group"
                                                aria-pressed={currentTheme === 'light'}
                                            >
                                                <div className={`w-28 h-20 bg-[#f5f5f5] rounded-xl border-2 flex flex-col p-2 gap-2 overflow-hidden transition-colors ${currentTheme === "light" ? "border-[#2563eb] ring-2 ring-[#2563eb]/20" : "border-gray-200 dark:border-zinc-700 hover:border-gray-300"}`}>
                                                    <div className="flex justify-end"><div className="w-4 h-1.5 rounded-full bg-gray-300" /></div>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="w-10 h-1.5 rounded-full bg-gray-200" />
                                                        <div className="w-8 h-1.5 rounded-full bg-gray-200" />
                                                    </div>
                                                    <div className="mt-auto flex justify-end">
                                                        <div className="w-3 h-3 rounded-full bg-[#2563eb]" />
                                                    </div>
                                                </div>
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${currentTheme === 'light' ? 'text-[#2563eb]' : 'text-gray-600 dark:text-slate-400'}`}>
                                                    <Sun className="w-3.5 h-3.5" /> Light
                                                </span>
                                            </button>

                                            {/* Dark Mode */}
                                            <button
                                                type="button"
                                                onClick={() => setTheme('dark')}
                                                className="flex flex-col items-center gap-2 group"
                                                aria-pressed={currentTheme === 'dark'}
                                            >
                                                <div className={`w-28 h-20 bg-[#232323] rounded-xl border-2 flex flex-col p-2 gap-2 overflow-hidden transition-colors ${currentTheme === "dark" ? "border-[#2563eb] ring-2 ring-[#2563eb]/20" : "border-gray-200 dark:border-zinc-700 hover:border-gray-300"}`}>
                                                    <div className="flex flex-col flex-1 bg-[#2c2c2c] rounded-md overflow-hidden p-1.5 gap-2 border border-white/5">
                                                        <div className="flex justify-end"><div className="w-4 h-1.5 rounded-full bg-white/20" /></div>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="w-10 h-1.5 rounded-full bg-white/10" />
                                                            <div className="w-8 h-1.5 rounded-full bg-white/10" />
                                                        </div>
                                                        <div className="mt-auto flex justify-end">
                                                            <div className="w-3 h-3 rounded-full bg-[#2563eb]" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${currentTheme === 'dark' ? 'text-[#2563eb]' : 'text-gray-600 dark:text-slate-400'}`}>
                                                    <Moon className="w-3.5 h-3.5" /> Dark
                                                </span>
                                            </button>

                                            {/* System Mode */}
                                            <button
                                                type="button"
                                                onClick={() => setTheme('system')}
                                                className="flex flex-col items-center gap-2 group"
                                                aria-pressed={currentTheme === 'system'}
                                            >
                                                <div className={`w-28 h-20 bg-[#232323] rounded-xl border-2 flex overflow-hidden transition-colors ${currentTheme === "system" ? "border-[#2563eb] ring-2 ring-[#2563eb]/20" : "border-gray-200 dark:border-zinc-700 hover:border-gray-300"}`}>
                                                    {/* Left Half (Light) */}
                                                    <div className="flex-1 bg-[#f5f5f5] h-full flex flex-col p-2 gap-1.5 relative border-r border-gray-300">
                                                        <div className="flex flex-col gap-1 mt-3">
                                                            <div className="w-8 h-1.5 rounded-full bg-gray-200" />
                                                            <div className="w-6 h-1.5 rounded-full bg-gray-200" />
                                                        </div>
                                                    </div>
                                                    {/* Right Half (Dark) */}
                                                    <div className="flex-1 bg-[#232323] h-full flex flex-col p-1.5 gap-1.5 relative">
                                                        <div className="bg-[#2c2c2c] flex-1 rounded-md border border-white/5 p-1 flex flex-col justify-between">
                                                            <div className="flex justify-end mt-0.5"><div className="w-3 h-1 rounded-full bg-white/20" /></div>
                                                            <div className="flex justify-end mt-auto mb-0.5">
                                                                <div className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${currentTheme === 'system' ? 'text-[#2563eb]' : 'text-gray-600 dark:text-slate-400'}`}>
                                                    <Monitor className="w-3.5 h-3.5" /> System
                                                </span>
                                            </button>

                                        </div>
                                    </div>
                                </section>

                            </div>
                        )}

                        {activeTabId === 'account' && <AccountSettings />}

                        {activeTabId === 'billing' && (
                            <Suspense
                                fallback={
                                    <div className="flex items-center justify-center py-24">
                                        <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
                                    </div>
                                }
                            >
                                <BillingSettings />
                            </Suspense>
                        )}

                        {activeTabId !== 'general' && activeTabId !== 'account' && activeTabId !== 'billing' && (
                            <div className="flex flex-col gap-6 animate-in fade-in duration-300 h-full justify-center items-center py-20 opacity-50">
                                <SettingsIcon className="w-12 h-12 text-gray-300 mb-2" />
                                <h2 className="text-xl font-medium">{SETTINGS_TABS.find(t => t.id === activeTabId)?.label || 'Tab'} Settings</h2>
                                <p className="text-sm text-gray-500 text-center max-w-sm">This section is a placeholder. Navigation works via the `[[...tab]]` catch-all route.</p>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
