'use client'

import { useEffect } from 'react'
import FingerprintJS from '@fingerprintjs/fingerprintjs'

export function FingerprintInitializer() {
  useEffect(() => {
    const setFingerprint = async () => {
      // 1. Try to get existing fingerprint from localStorage
      let visitorId = localStorage.getItem('device_fingerprint');

      if (!visitorId) {
        // 2. Generate new fingerprint if not in localStorage
        const fp = await FingerprintJS.load()
        const result = await fp.get()
        visitorId = result.visitorId;
        
        // Save to localStorage for future use
        localStorage.setItem('device_fingerprint', visitorId);
      }
      
      // 3. Store in cookie so it's sent to server-side API routes
      document.cookie = `x-fingerprint=${visitorId}; path=/; max-age=31536000; SameSite=Lax`
    }

    setFingerprint()
  }, [])

  return null
}
