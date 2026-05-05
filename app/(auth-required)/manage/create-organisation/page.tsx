"use client";
import React, { useState } from 'react';
import { 
    Building2, 
    Globe, 
    Image as ImageIcon, 
    ArrowLeft, 
    ArrowRight,
    Loader2,
    Shield
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';

export default function CreateOrganisationPage() {
    const router = useRouter();
    const { refreshUser, setActiveOrgId } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [createdOrg, setCreatedOrg] = useState<any>(null);
    
    const [formData, setFormData] = useState({
        name: '',
        website: '',
        logoUrl: ''
    });

    const formatWebsite = (val: string) => {
        // Remove http://, https:// and trailing slash
        return val.replace(/^https?:\/\//, '').replace(/\/$/, '');
    };

    const handleWebsiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, website: formatWebsite(e.target.value) });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.name.trim().length < 3) {
            toast.error("Organisation name must be at least 3 characters");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/manage/organinsations/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.ok) {
                const orgData = result.data;
                setCreatedOrg(orgData);
                
                // 1. Update active organisation in context & localStorage
                setActiveOrgId(orgData.organisationId);
                
                // 2. Refresh user data to update sidebar
                await refreshUser();
                
                // 3. Show success modal
                setShowSuccessModal(true);
                toast.success("Organisation created successfully!");
            } else {
                toast.error(result.error || "Failed to create organisation");
            }
        } catch (error) {
            console.error("Create organisation error:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#f9f9f9] dark:bg-[#121212] p-4 sm:p-8 animate-in fade-in duration-500">
            
            {/* Back Button */}
            <Link 
                href="/dashboard"
                className="absolute top-8 left-8 flex items-center gap-2 text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors group"
            >
                <div className="p-2 rounded-full group-hover:bg-gray-100 dark:group-hover:bg-white/5 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                </div>
                Back to dashboard
            </Link>

            <div className="max-w-xl w-full">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex p-4 rounded-3xl bg-[#D4F46A] mb-6 shadow-lg shadow-[#D4F46A]/20 transform transition-transform hover:scale-110">
                        <Building2 className="w-8 h-8 text-black" />
                    </div>
                    <h1 className="text-3xl font-bold text-[#333] dark:text-[#ececec] tracking-tight mb-2">
                        Create your Organisation
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Set up a dedicated workspace for your team and workflows.
                    </p>
                </div>

                {/* Form Card */}
                <form 
                    onSubmit={handleSubmit}
                    className="bg-white dark:bg-[#1c1c1c] rounded-[2.5rem] border border-gray-200 dark:border-white/10 p-8 sm:p-10 shadow-2xl shadow-black/5"
                >
                    <div className="space-y-8">
                        
                        {/* Logo Preview Section */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-24 h-24 rounded-[2rem] bg-gray-50 dark:bg-black/40 border-2 border-dashed border-gray-200 dark:border-white/10 flex items-center justify-center overflow-hidden group relative">
                                {formData.logoUrl ? (
                                    <img 
                                        src={formData.logoUrl} 
                                        alt="Logo Preview" 
                                        className="w-full h-full object-cover"
                                        onError={(e) => (e.currentTarget.src = "")}
                                    />
                                ) : (
                                    <ImageIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                )}
                            </div>
                            <div className="w-full space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                                    Organisation Logo URL
                                </label>
                                <div className="relative">
                                    <input 
                                        type="url"
                                        value={formData.logoUrl}
                                        onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                                        placeholder="https://example.com/logo.png"
                                        className="w-full px-4 py-3.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5 rounded-2xl text-sm focus:border-[#D4F46A] outline-none transition-all placeholder:text-gray-400"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">
                                        Optional
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fields */}
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                                    Organisation Name
                                </label>
                                <div className="relative group">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#D4F46A] transition-colors" />
                                    <input 
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Acme Corp"
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5 rounded-2xl text-base focus:border-[#D4F46A] outline-none transition-all placeholder:text-gray-400"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                                    Business Website
                                </label>
                                <div className="relative group">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#D4F46A] transition-colors" />
                                    <input 
                                        type="text"
                                        value={formData.website}
                                        onChange={handleWebsiteChange}
                                        placeholder="acme.com"
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5 rounded-2xl text-base focus:border-[#D4F46A] outline-none transition-all placeholder:text-gray-400"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 px-1">
                                    Enter domain only (no http:// or /)
                                </p>
                            </div>
                        </div>

                        {/* Submit */}
                        <button 
                            disabled={isLoading || !formData.name}
                            type="submit"
                            className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-bold text-base shadow-xl shadow-black/10 flex items-center justify-center gap-3 transition-all hover:translate-y-[-2px] hover:shadow-2xl disabled:opacity-50 disabled:translate-y-0"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Initializing...
                                </>
                            ) : (
                                <>
                                    Create Organisation
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Footer Security Note */}
                <div className="mt-8 flex items-center justify-center gap-2 text-gray-400 dark:text-gray-500">
                    <Shield className="w-4 h-4" />
                    <span className="text-xs">Secure Workspace Isolation Enabled</span>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && createdOrg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                    />
                    <div className="relative w-full max-w-md bg-white dark:bg-[#1c1c1c] rounded-[3rem] p-8 sm:p-10 shadow-2xl border border-gray-100 dark:border-white/5 animate-in zoom-in-95 fade-in duration-300 text-center">
                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 rounded-3xl bg-[#D4F46A] flex items-center justify-center mb-6 shadow-xl shadow-[#D4F46A]/20">
                                {createdOrg.logoUrl ? (
                                    <img src={createdOrg.logoUrl} className="w-full h-full object-cover rounded-3xl" alt="Org Logo" />
                                ) : (
                                    <Building2 className="w-10 h-10 text-black" />
                                )}
                            </div>
                            
                            <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
                                Workspace Ready!
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
                                Your new organisation <span className="font-semibold text-black dark:text-white">"{createdOrg.name}"</span> has been successfully initialized.
                            </p>

                            <div className="w-full space-y-3 mb-8">
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <div className="flex items-center gap-3">
                                        <Globe className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Website</span>
                                    </div>
                                    <span className="text-sm text-black dark:text-white">{createdOrg.website || 'Not set'}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <div className="flex items-center gap-3">
                                        <Shield className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Role</span>
                                    </div>
                                    <span className="text-sm font-semibold text-[#D4F46A] uppercase tracking-wider">{createdOrg.role}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 w-full gap-3">
                                <button 
                                    onClick={() => router.push('/dashboard')}
                                    className="w-full py-4 bg-[#D4F46A] text-black font-bold rounded-2xl hover:scale-[1.02] transition-transform shadow-lg shadow-[#D4F46A]/20"
                                >
                                    Go to Dashboard
                                </button>
                                <button 
                                    onClick={() => router.push('/settings')}
                                    className="w-full py-4 text-gray-500 hover:text-black dark:hover:text-white text-sm font-medium transition-colors"
                                >
                                    Configure Settings
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
