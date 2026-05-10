'use client'

import React, { useEffect, useState, useRef } from 'react'
import { ShieldAlert, ArrowRight, Lock } from 'lucide-react'

/**
 * SessionManager - Globally monitors for 401/403 responses
 * and handles session expiration with a high-fidelity, non-closable dialog.
 */
export function SessionManager() {
  const [isExpired, setIsExpired] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const interceptorRef = useRef<boolean>(false)

  useEffect(() => {
    if (interceptorRef.current) return
    interceptorRef.current = true

    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)
        
        // Handle both Unauthorized (401) and Forbidden (403)
        if (response.status === 401 || response.status === 403) {
          setIsExpired(true)
        }
        
        return response
      } catch (error) {
        throw error
      }
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

  // Calculate circle properties
  const radius = 24
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (countdown / 3) * circumference

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="relative w-full max-w-[320px] p-6 bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.4)] border border-white/20 text-center animate-in zoom-in-95 duration-500">
        
        {/* Urgent Pulsing Background Ring */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-16 h-16 bg-red-500/10 rounded-full animate-ping opacity-20" />

        <div className="relative mb-6 flex justify-center">
          <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg shadow-red-500/20 transform -rotate-2">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 p-1.5 bg-black rounded-lg shadow-lg">
            <Lock className="w-3 h-3 text-white" />
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-black mb-2 tracking-tight">
          Session Expired
        </h2>
        <p className="text-[13px] text-gray-500 mb-6 leading-relaxed px-2">
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
                  className="text-gray-100"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="18"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="transparent"
                  strokeDasharray={113} // 2 * PI * 18
                  style={{ 
                    strokeDashoffset: isNaN(113 - (countdown / 3) * 113) ? 0 : 113 - (countdown / 3) * 113,
                    transition: 'stroke-dashoffset 100ms linear'
                  }}
                  className="text-red-500"
                />
              </svg>
              <span className="absolute text-sm font-bold tabular-nums text-black">
                {Math.ceil(countdown)}
              </span>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="group w-full py-3 bg-black text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
          >
            Reconnect
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  )
}
