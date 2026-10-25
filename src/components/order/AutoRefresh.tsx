'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/** Re-renders the server page periodically while the tab is visible (status tracking). */
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter()
  useEffect(() => {
    if (seconds <= 0) return
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh()
    }, seconds * 1000)
    return () => window.clearInterval(id)
  }, [router, seconds])
  return null
}
