'use client'

import { useState } from 'react'
import { Mail, ArrowRight, Loader2, Command } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { BrandLogo } from '@/components/BrandLogo'

export default function AuthPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-[#0b1220]">
                <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
            </div>
        }>
            <AuthContent />
        </Suspense>
    )
}

function AuthContent() {
    const searchParams = useSearchParams()
    const redirectURL = searchParams.get('redirectURL') || '/dashboard'

    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showOTP, setShowOTP] = useState(false)
    const [userExists, setUserExists] = useState(true)
    const [token, setToken] = useState('')

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return
        setIsSubmitting(true)

        try {
            const response = await fetch('/api/auth/login-with-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()

            if (response.ok) {
                setUserExists(data.data.isExistingUser)
                setToken(data.data.otpToken)
                setShowOTP(true)
                toast.success("OTP sent successfully")
            } else {
                toast.error(data.error || "Failed to send OTP. Please try again.")
            }
        } catch (error) {
            console.error("Auth error:", error)
            toast.error("An error occurred. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) {
            // Handle cases where multiple characters are entered (like paste or fast typing)
            if (value.length === 6 && /^\d{6}$/.test(value)) {
                setOtp(value.split(''))
                return
            }
            value = value.slice(-1)
        }
        if (!/^\d*$/.test(value)) return

        const newOtp = [...otp]
        newOtp[index] = value
        setOtp(newOtp)

        // Auto focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`)
            nextInput?.focus()
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').slice(0, 6)
        if (!/^\d+$/.test(pastedData)) return

        const newOtp = [...otp]
        pastedData.split('').forEach((char, i) => {
            if (i < 6) newOtp[i] = char
        })
        setOtp(newOtp)

        // Focus the last input or the next empty one
        const nextIndex = Math.min(pastedData.length, 5)
        document.getElementById(`otp-${nextIndex}`)?.focus()
    }


    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`)
            prevInput?.focus()
        }
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        const otpValue = otp.join('')
        if (otpValue.length !== 6) return

        setIsSubmitting(true)

        try {
            const response = await fetch('/api/auth/login-with-email/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    otp: otpValue,
                    token,
                    email,
                }),
            })

            const data = await response.json()

            if (response.ok) {
                toast.success("Authentication successful!")
                const needsOnboarding =
                    data.data?.isNewUser === true ||
                    data.data?.onboardingCompleted === false
                window.location.href = needsOnboarding ? '/onboarding' : redirectURL
            } else {
                toast.error(data.error || "Verification failed. Please check your code.")
            }
        } catch (error) {
            console.error("Verification error:", error)
            toast.error("An error occurred during verification. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-[#0b1220] p-4 relative overflow-hidden font-sans">
            {/* Background decoration elements for premium feel */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#2563eb_1px,transparent_1px),linear-gradient(to_bottom,#2563eb_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20 dark:opacity-10 pointer-events-none" />
            <div className="absolute top-[10%] left-[50%] translate-x-[-50%] w-[40%] h-[40%] rounded-full bg-[#2563eb]/20 dark:bg-[#2563eb]/25 blur-[120px] pointer-events-none" />

            <div className="w-full max-w-[26rem] bg-white/70 dark:bg-[#111827]/90 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 rounded-[2rem] shadow-sm dark:shadow-none p-8 relative z-10 transition-all duration-500">
                <div className="flex flex-col items-center mb-8">
                    <BrandLogo className="w-48 h-10 shrink-0 mb-8" />
                    <h1 className="text-2xl font-semibold text-zinc-900 dark:text-slate-50 mb-2 tracking-tight">
                        {showOTP ? (userExists ? "Verify it's you" : "Create your account") : "Welcome back"}
                    </h1>
                    {showOTP ? (
                        <div className="flex flex-col items-center gap-2 text-sm text-zinc-500 dark:text-slate-400 text-center px-2">
                            <p>
                                {userExists
                                    ? `We've sent a 6-digit verification code to `
                                    : `Enter the 6-digit code sent to `}
                                <span className="font-semibold text-zinc-900 dark:text-slate-100">{email}</span>
                                {!userExists && " to verify your email."}
                            </p>
                            <p className="text-xs opacity-80">
                                Can&apos;t find it? Please check your <span className="text-zinc-900 dark:text-slate-200 font-medium">spam</span> or junk folder.
                            </p>
                            <button
                                onClick={() => setShowOTP(false)}
                                className="text-[#2563eb] hover:underline font-medium text-xs mt-1"
                            >
                                Change email address
                            </button>
                        </div>
                    ) : (
                        <p className="text-sm text-zinc-500 dark:text-slate-400 text-center">
                            Enter your details to sign in to your account
                        </p>
                    )}
                </div>

                {!showOTP ? (
                    <>
                        <form onSubmit={handleEmailSubmit} className="space-y-4 mb-8 group">
                            <div className="relative overflow-hidden rounded-xl bg-zinc-50 dark:bg-slate-900/80 border border-zinc-200 dark:border-white/10 focus-within:border-zinc-900 dark:focus-within:border-[#2563eb] transition-colors">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-slate-500">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    required
                                    className="block w-full pl-11 pr-4 py-3.5 bg-transparent text-sm text-zinc-900 dark:text-slate-100 placeholder-zinc-400 dark:placeholder-slate-500 focus:outline-none transition-all"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting || !email}
                                className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-[#2563eb] text-white py-3.5 rounded-xl text-sm font-medium hover:bg-zinc-800 dark:hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 dark:focus:ring-[#2563eb] dark:focus:ring-offset-[#111827] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
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
                                <div className="w-full border-t border-zinc-200 dark:border-white/10" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="px-3 bg-zinc-50/80 dark:bg-[#111827] text-[11px] font-medium text-zinc-500 dark:text-slate-400 uppercase tracking-widest">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        {/* Social Logins — hook page then AuthProvider gates to onboarding if needed */}
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <SocialButton icon={<GoogleIcon />} onClick={() => signIn('google', { callbackUrl: '/auth/hook?method=google' })} />
                            <SocialButton icon={<GithubIcon />} onClick={() => signIn('github', { callbackUrl: '/auth/hook?method=github' })} />
                            <SocialButton icon={<LinkedInIcon />} onClick={() => signIn('linkedin', { callbackUrl: '/auth/hook?method=linkedin' })} />
                            <SocialButton icon={<XIcon />} onClick={() => signIn('twitter', { callbackUrl: '/auth/hook?method=twitter' })} />
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-6 mb-8">
                        <div className="space-y-2">
                            <div className="flex justify-between gap-2">
                                {otp.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        id={`otp-${idx}`}
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(idx, e)}
                                        onPaste={handlePaste}
                                        className="w-12 h-14 text-center text-lg font-semibold bg-zinc-50 dark:bg-slate-900/80 border border-zinc-200 dark:border-white/10 rounded-xl focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all text-zinc-900 dark:text-slate-100"
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-6">
                            <button
                                type="submit"
                                disabled={isSubmitting || otp.some(d => !d)}
                                className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-[#2563eb] text-white py-3.5 rounded-xl text-sm font-medium hover:bg-zinc-800 dark:hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 dark:focus:ring-[#2563eb] dark:focus:ring-offset-[#111827] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    "Verify OTP"
                                )}
                            </button>
                        </div>
                        <div className="text-center">
                            <button type="button" className="text-xs text-zinc-500 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-slate-100 transition-colors">
                                Resend code in 0:59
                            </button>
                        </div>
                    </form>
                )}

                <p className="text-center text-[13px] text-zinc-500 dark:text-slate-400 leading-relaxed px-2">
                    By clicking continue, you agree to our{' '}
                    <a href="#" className="underline decoration-zinc-300 dark:decoration-slate-600 hover:text-zinc-900 dark:hover:text-slate-100 transition-colors">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="underline decoration-zinc-300 dark:decoration-slate-600 hover:text-zinc-900 dark:hover:text-slate-100 transition-colors">Privacy Policy</a>.
                </p>
            </div>
        </div>
    )
}

function SocialButton({ icon, onClick }: { icon: React.ReactNode, onClick?: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex items-center justify-center w-12 h-12 bg-white dark:bg-slate-900 border border-zinc-200 dark:border-white/10 rounded-full hover:bg-zinc-50 dark:hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:focus:ring-white/20 group shadow-sm hover:shadow dark:shadow-none active:scale-[0.98]"
        >
            <span className="w-5 h-5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">{icon}</span>
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


function GithubIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-full h-full text-[#181717] dark:text-white" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
    )
}

function LinkedInIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-[85%] h-[85%] text-[#0A66C2]" fill="currentColor" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
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

