'use client'

import { useEffect } from 'react'
import FingerprintJS from '@fingerprintjs/fingerprintjs'

export function FingerprintInitializer() {
  useEffect(() => {
    const setFingerprint = async () => {
      const fp = await FingerprintJS.load()
      const result = await fp.get()
      
      // Store in cookie so it's sent to server-side API routes
      document.cookie = `x-fingerprint=${result.visitorId}; path=/; max-age=31536000; SameSite=Lax`
    }

    setFingerprint()
  }, [])

  return null
}
