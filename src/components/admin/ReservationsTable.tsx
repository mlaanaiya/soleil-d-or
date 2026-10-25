'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { updateReservationStatus } from '@/app/admin/_actions/bookings'
import type { ActionState } from '@/lib/action-state'
import { RESERVATION_STATUS_LABELS, type ReservationStatus } from '@/lib/schemas'
import { Toast } from './Toast'

export type AdminReservation = {
  id: number
  ref: string
  name: string
  phone: string
  email: string
  dateLabel: string
  time: string
  partySize: number
  note: string
  status: ReservationStatus
}

export function ReservationsTable({ rows, live }: { rows: AdminReservation[]; live: boolean }) {
  const router = useRouter()
  const [state, setState] = useState<ActionState | null>(null)
  const [pending, start] = useTransition()
  useEffect(() => {
    if (!live) return
    const id = window.setInterval(() => router.refresh(), 30000)
    return () => window.clearInterval(id)
  }, [router, live])
  const run = (id: number, status: ReservationStatus) =>
    start(async () => {
      setState(await updateReservationStatus(id, status))
      router.refresh()
    })

  if (rows.length === 0) return <p className="adm-empty">Aucune réservation.</p>
  return (
    <div className="adm-card" style={{ overflowX: 'auto' }}>
      <table className="adm-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Heure</th>
            <th>Pers.</th>
            <th>Client</th>
            <th>Statut</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.dateLabel}</td>
              <td>
                <strong>{r.time}</strong>
              </td>
              <td>{r.partySize}</td>
              <td>
                <strong>{r.name}</strong>
                <br />
                <a href={`tel:${r.phone.replace(/[^+0-9]/g, '')}`}>{r.phone}</a>
                {r.email && (
                  <>
                    <br />
                    <a href={`mailto:${r.email}`}>{r.email}</a>
                  </>
                )}
                {r.note && <p className="adm-sub">{r.note}</p>}
                <small className="adm-sub">Réf. {r.ref}</small>
              </td>
              <td>
                <span
                  className="adm-tag"
                  data-tone={r.status === 'pending' ? 'sun' : r.status === 'confirmed' ? undefined : 'off'}
                >
                  {RESERVATION_STATUS_LABELS[r.status]}
                </span>
              </td>
              <td>
                <div className="adm-order-btns">
                  {r.status !== 'confirmed' && (
                    <button
                      type="button"
                      className="adm-btn adm-btn--small adm-btn--primary"
                      disabled={pending}
                      onClick={() => run(r.id, 'confirmed')}
                    >
                      Confirmer
                    </button>
                  )}
                  {r.status === 'pending' && (
                    <button
                      type="button"
                      className="adm-btn adm-btn--small adm-btn--danger"
                      disabled={pending}
                      onClick={() => run(r.id, 'declined')}
                    >
                      Refuser
                    </button>
                  )}
                  {r.status === 'confirmed' && (
                    <button
                      type="button"
                      className="adm-btn adm-btn--small adm-btn--danger"
                      disabled={pending}
                      onClick={() => window.confirm('Annuler cette réservation ?') && run(r.id, 'cancelled')}
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Toast state={state} />
    </div>
  )
}
