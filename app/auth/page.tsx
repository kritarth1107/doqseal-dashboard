'use client'

import { useState } from 'react'
import { Mail, ArrowRight, Loader2, Command } from 'lucide-react'

export default function AuthPage() {
    const [email, setEmail] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        // Simulate API call for OTP/Magic Link
        setTimeout(() => setIsSubmitting(false), 2000)
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 relative overflow-hidden font-sans">
            {/* Background decoration elements for premium feel */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#D4F46A_1px,transparent_1px),linear-gradient(to_bottom,#D4F46A_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20 pointer-events-none" />
            <div className="absolute top-[10%] left-[50%] translate-x-[-50%] w-[40%] h-[40%] rounded-full bg-[#D4F46A]/20 dark:bg-[#D4F46A]/10 blur-[120px] pointer-events-none" />

            <div className="w-full max-w-[26rem] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] shadow-sm  p-8 relative z-10 transition-all duration-300">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-[#D4F46A] text-white dark:text-zinc-900 rounded-[14px] flex items-center justify-center mb-6 shadow-none rotate-3 hover:rotate-0 transition-transform duration-300">

                        <img src="/sakshya_logo.svg" alt="Sakshya Logo" className="w-6 h-6 brightness-0 shrink-0" />
                    </div>
                    <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2 tracking-tight">
                        Welcome back
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
                        Enter your details to sign in to your account
                    </p>
                </div>

                {/* Email OTP Login */}
                <form onSubmit={handleEmailSubmit} className="space-y-4 mb-8 group">
                    <div className="relative overflow-hidden rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus-within:border-zinc-900 dark:focus-within:border-zinc-100 transition-colors">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                            <Mail className="h-5 w-5" />
                        </div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            required
                            className="block w-full pl-11 pr-4 py-3.5 bg-transparent text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting || !email}
                        className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-3.5 rounded-xl text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 dark:focus:ring-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md dark:ring-offset-zinc-950"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                Continue with Email <ArrowRight className="w-4 h-4 ml-1 group-focus-within:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="relative mb-8">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="px-3 bg-white/0 backdrop-blur-md text-[11px] font-medium text-zinc-500 uppercase tracking-widest">
                            Or continue with
                        </span>
                    </div>
                </div>

                {/* Social Logins */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <SocialButton name="Google" icon={<GoogleIcon />} />
                    <SocialButton name="Apple" icon={<AppleIcon />} />
                    <SocialButton name="GitHub" icon={<GithubIcon />} />
                    <SocialButton name="LinkedIn" icon={<LinkedInIcon />} />
                    <SocialButton name="Facebook" icon={<FacebookIcon />} />
                    <SocialButton name="X" icon={<XIcon />} />
                </div>

                <p className="text-center text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed px-2">
                    By clicking continue, you agree to our{' '}
                    <a href="#" className="underline decoration-zinc-300 dark:decoration-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="underline decoration-zinc-300 dark:decoration-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">Privacy Policy</a>.
                </p>
            </div>
        </div>
    )
}

function SocialButton({ name, icon }: { name: string; icon: React.ReactNode }) {
    return (
        <button
            type="button"
            className="flex items-center justify-center gap-2.5 w-full px-4 py-2.5 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-all focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-700 group shadow-sm hover:shadow active:scale-[0.98]"
        >
            <span className="w-5 h-5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">{icon}</span>
            <span>{name}</span>
        </button>
    )
}

// -- SVG Icons -- //

function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-full h-full" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    )
}

function AppleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-full h-full text-black dark:text-white" fill="currentColor" aria-hidden="true">
            <path d="M16.365 7.063c-.022 2.655 2.212 3.52 2.247 3.535-.018.06-3.483 11.942-8.358 11.942-2.185 0-3.3-1.353-5.594-1.353-2.296 0-3.58 1.32-5.542 1.353-1.996.033-4.47-2.636-6.195-5.183-3.483-5.148-4.228-11.455-1.168-14.156 1.487-1.31 3.238-1.545 4.542-1.545 2.305 0 3.407 1.196 5.61 1.196 2.012 0 3.45-1.258 5.757-1.23 1.83.02 3.864.764 4.86 2.046-3.9 1.944-3.864 5.346-3.834 5.39z" />
            <path d="M14.777 4.535c.804-.986 1.34-2.338 1.19-3.71-1.157.047-2.583.784-3.415 1.785-.664.793-1.298 2.18-1.116 3.515 1.28.1 2.535-.615 3.34-1.59z" />
        </svg>
    )
}

function GithubIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-full h-full text-[#181717] dark:text-white" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
    )
}

function LinkedInIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-[85%] h-[85%] text-[#0A66C2] dark:text-[#388bd1]" fill="currentColor" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
    )
}

function FacebookIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-full h-full text-[#1877F2]" fill="currentColor" aria-hidden="true">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    )
}

function XIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-[85%] h-[85%] text-black dark:text-white" fill="currentColor" aria-hidden="true">
            <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
        </svg>
    )
}

