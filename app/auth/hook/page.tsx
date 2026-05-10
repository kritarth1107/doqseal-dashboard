"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Loader2, 
  ShieldCheck, 
  Cpu, 
  Globe, 
  CheckCircle2,
  Zap
} from 'lucide-react';

// Social Icons Components
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#181717]" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7 text-[#0A66C2]" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7 text-black" fill="currentColor">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

function HookContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const method = searchParams.get('method')?.toLowerCase() || 'google';

  const [statusIndex, setStatusIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const statuses = [
    { text: "Verifying credentials...", icon: ShieldCheck },
    { text: "Establishing secure connection...", icon: Globe },
    { text: "Synchronizing document intelligence...", icon: Cpu },
    { text: "Preparing your workspace...", icon: Zap },
    { text: "Redirecting to dashboard...", icon: CheckCircle2 }
  ];

  useEffect(() => {
    const statusInterval = setInterval(() => {
      setStatusIndex((prev) => {
        if (prev < statuses.length - 1) return prev + 1;
        clearInterval(statusInterval);
        setIsDone(true);
        return prev;
      });
    }, 1500);

    return () => clearInterval(statusInterval);
  }, []);

  useEffect(() => {
    if (isDone) {
      setTimeout(() => {
        router.push('/dashboard');
      }, 800);
    }
  }, [isDone, router]);

  const renderProviderIcon = () => {
    switch (method) {
      case 'google': return <GoogleIcon />;
      case 'github': return <GithubIcon />;
      case 'linkedin': return <LinkedInIcon />;
      case 'x': return <XIcon />;
      default: return <GoogleIcon />;
    }
  };

  const CurrentIcon = statuses[statusIndex].icon;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#fcfcfc] relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#2563eb]/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6">
        
        {/* Animated Connection UI */}
        <div className="flex items-center gap-8 mb-16 relative">
          {/* Provider Logo */}
          <div className="w-20 h-20 rounded-2xl bg-white border border-zinc-200 shadow-xl flex items-center justify-center animate-pulse-subtle">
            {renderProviderIcon()}
          </div>

          {/* Connection Line */}
          <div className="w-16 h-[2px] bg-zinc-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#2563eb] to-transparent animate-shimmer" />
          </div>

          {/* DoqSeal Logo */}
          <div className="w-20 h-20 rounded-2xl bg-[#2563eb] shadow-lg shadow-[#2563eb]/20 flex items-center justify-center rotate-3 animate-pulse-slow">
            <img src="/doqseal_logo.svg" alt="DoqSeal" className="w-10 h-10 brightness-0" />
          </div>

          {/* Particle Effects */}
          <div className="absolute -top-4 -bottom-4 -left-4 -right-4 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-1 h-1 bg-[#2563eb] rounded-full animate-float-particle-1" />
            <div className="absolute bottom-0 right-1/4 w-1 h-1 bg-[#2563eb] rounded-full animate-float-particle-2" />
          </div>
        </div>

        {/* Status Section */}
        <div className="text-center space-y-6 w-full">
          <div className="h-8 flex items-center justify-center gap-3">
             <div className={`transition-all duration-500 ${isDone ? 'text-emerald-500' : 'text-[#2563eb]'}`}>
               <CurrentIcon className="w-5 h-5 animate-in fade-in zoom-in duration-500" />
             </div>
             <p className="text-base font-medium text-zinc-900 tracking-tight transition-all duration-500 animate-in slide-in-from-bottom-2">
               {statuses[statusIndex].text}
             </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#2563eb] transition-all duration-1000 ease-out rounded-full shadow-[0_0_8px_#2563eb]" 
              style={{ width: `${((statusIndex + 1) / statuses.length) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-2">
            {!isDone ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            )}
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
              {isDone ? 'Authenticated' : 'Secure Handshake'}
            </span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0,0,0,0); }
          50% { transform: scale(1.02); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1) rotate(3deg); }
          50% { transform: scale(1.05) rotate(5deg); }
        }
        @keyframes float-particle-1 {
          0% { transform: translate(0, 0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translate(40px, -20px); opacity: 0; }
        }
        @keyframes float-particle-2 {
          0% { transform: translate(0, 0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translate(-40px, 20px); opacity: 0; }
        }
        .animate-shimmer { animation: shimmer 2s infinite linear; }
        .animate-pulse-subtle { animation: pulse-subtle 3s infinite ease-in-out; }
        .animate-pulse-slow { animation: pulse-slow 4s infinite ease-in-out; }
        .animate-float-particle-1 { animation: float-particle-1 3s infinite ease-out; }
        .animate-float-particle-2 { animation: float-particle-2 3.5s infinite ease-out; }
      `}</style>
    </div>
  );
}

export default function AuthHookPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
      </div>
    }>
      <HookContent />
    </Suspense>
  );
}