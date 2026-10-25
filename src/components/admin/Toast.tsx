'use client'

import { useEffect, useState } from 'react'
import type { ActionState } from '@/lib/action-state'

/** Shows the latest action result for a few seconds (errors stay until replaced). */
export function Toast({ state }: { state: ActionState | null }) {
  const [visible, setVisible] = useState<ActionState | null>(null)
  const [shownAt, setShownAt] = useState<number | undefined>(undefined)
  if (state?.message && state.at !== shownAt) {
    setShownAt(state.at)
    setVisible(state)
  }
  useEffect(() => {
    if (!visible?.ok) return
    const id = window.setTimeout(() => setVisible(null), 3500)
    return () => window.clearTimeout(id)
  }, [visible])
  if (!visible?.message) return null
  return (
    <div className="adm-toast" data-ok={visible.ok} role={visible.ok ? 'status' : 'alert'} onClick={() => setVisible(null)}>
      {visible.message}
    </div>
  )
}
