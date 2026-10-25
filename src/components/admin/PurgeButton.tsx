'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { purgeOld } from '@/app/admin/_actions/bookings'
import type { ActionState } from '@/lib/action-state'
import { Toast } from './Toast'

/** Data minimisation: removes finished orders and past reservations older than 90 days. */
export function PurgeButton() {
  const router = useRouter()
  const [state, setState] = useState<ActionState | null>(null)
  const [pending, start] = useTransition()
  return (
    <section className="adm-card" style={{ marginTop: 24 }}>
      <h2>Données personnelles</h2>
      <p className="adm-card-sub">Supprimez les commandes terminées et les réservations passées de plus de 90 jours (bonne pratique RGPD).</p>
      <button
        type="button"
        className="adm-btn adm-btn--danger"
        disabled={pending}
        onClick={() =>
          window.confirm('Supprimer définitivement les données de plus de 90 jours ?') &&
          start(async () => {
            setState(await purgeOld(90))
            router.refresh()
          })
        }
      >
        Supprimer les données de plus de 90 jours
      </button>
      <Toast state={state} />
    </section>
  )
}
