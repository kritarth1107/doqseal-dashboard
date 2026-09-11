'use client'

import React, { useEffect, useState, useRef } from 'react'
import { ShieldAlert, ArrowRight, Lock } from 'lucide-react'

/**
 * SessionManager - Globally monitors for 401 responses.
 * Tries a silent session refresh first; only then shows the re-login dialog.
 * 403 (banned/suspended) still forces re-login without refresh.
 */
export function SessionManager() {
  const [isExpired, setIsExpired] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const interceptorRef = useRef<boolean>(false)
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null)

  useEffect(() => {
    if (interceptorRef.current) return
    interceptorRef.current = true

    const originalFetch = window.fetch

    const shouldSkipRefresh = (input: RequestInfo | URL) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url
      return (
        url.includes('/api/auth/refresh') ||
        url.includes('/api/auth/logout') ||
        url.includes('/api/auth/login') ||
        url.includes('/api/auth/mobile') ||
        url.includes('/api/auth/providers') ||
        url.includes('/api/auth/csrf') ||
        url.includes('/api/auth/callback') ||
        url.includes('/api/auth/signin') ||
        url.includes('/api/auth/session')
      )
    }

    const trySilentRefresh = async () => {
      if (!refreshPromiseRef.current) {
        refreshPromiseRef.current = originalFetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'same-origin',
        })
          .then((res) => res.ok)
          .catch(() => false)
          .finally(() => {
            refreshPromiseRef.current = null
          })
      }
      return refreshPromiseRef.current
    }

    window.fetch = async (...args) => {
      const response = await originalFetch(...args)

      if (response.status === 403) {
        setIsExpired(true)
        return response
      }

      if (response.status !== 401) {
        return response
      }

      if (shouldSkipRefresh(args[0])) {
        return response
      }

      const refreshed = await trySilentRefresh()
      if (refreshed) {
        return originalFetch(...args)
      }

      setIsExpired(true)
      return response
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  useEffect(() => {
    if (isExpired) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 0.1) {
            clearInterval(timer)
            handleLogout()
            return 0
          }
          return Number((prev - 0.1).toFixed(1))
        })
      }, 100)

      return () => clearInterval(timer)
    }
  }, [isExpired])

  const handleLogout = async () => {
    try {
      const currentPath = window.location.pathname + window.location.search;
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = `/auth?redirectURL=${encodeURIComponent(currentPath)}`;
    } catch (error) {
      const currentPath = window.location.pathname + window.location.search;
      window.location.href = `/auth?redirectURL=${encodeURIComponent(currentPath)}`;
    }
  };

  if (!isExpired) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="relative w-full max-w-[320px] p-6 bg-white dark:bg-zinc-900 backdrop-blur-2xl rounded-[2rem] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.4)] border border-zinc-200 dark:border-zinc-700 text-center animate-in zoom-in-95 duration-500">
        
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-16 h-16 bg-red-500/10 rounded-full animate-ping opacity-20" />

        <div className="relative mb-6 flex justify-center">
          <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg shadow-red-500/20 transform -rotate-2">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 p-1.5 bg-zinc-900 dark:bg-zinc-950 rounded-lg shadow-lg border border-transparent dark:border-zinc-700">
            <Lock className="w-3 h-3 text-white" />
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2 tracking-tight">
          Session Expired
        </h2>
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed px-2">
          Your account has been secured. Redirecting you to login.
        </p>

        <div className="space-y-5">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="18"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="transparent"
                  className="text-zinc-100 dark:text-zinc-700"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="18"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="transparent"
                  strokeDasharray={113}
                  style={{ 
                    strokeDashoffset: isNaN(113 - (countdown / 3) * 113) ? 0 : 113 - (countdown / 3) * 113,
                    transition: 'stroke-dashoffset 100ms linear'
                  }}
                  className="text-red-500"
                />
              </svg>
              <span className="absolute text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                {Math.ceil(countdown)}
              </span>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="group w-full py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
          >
            Reconnect
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  )
}
