'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { updateOrderStatus } from '@/app/admin/_actions/bookings'
import type { ActionState } from '@/lib/action-state'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/lib/schemas'
import { Toast } from './Toast'

export type AdminOrder = {
  id: number
  ref: string
  customerName: string
  phone: string
  pickupLabel: string
  items: Array<{ name: string; label: string; quantity: number; total: string }>
  total: string
  note: string
  status: OrderStatus
  createdLabel: string
}

const NEXT: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  new: { status: 'accepted', label: 'Accepter' },
  accepted: { status: 'ready', label: 'Marquer prête' },
  ready: { status: 'done', label: 'Retirée' },
}

/** A short two-tone chime generated with Web Audio (no audio file). */
function chime() {
  try {
    const ctx = new AudioContext()
    ;[880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18)
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + i * 0.18 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.5)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + i * 0.18)
      osc.stop(ctx.currentTime + i * 0.18 + 0.55)
    })
  } catch {
    /* audio unavailable */
  }
}

export function OrdersBoard({ orders, live }: { orders: AdminOrder[]; live: boolean }) {
  const router = useRouter()
  const [state, setState] = useState<ActionState | null>(null)
  const [pending, start] = useTransition()
  const [sound, setSound] = useState(false)
  const known = useRef<Set<number> | null>(null)

  useEffect(() => {
    if (!live) return
    const id = window.setInterval(() => router.refresh(), 15000)
    return () => window.clearInterval(id)
  }, [router, live])

  useEffect(() => {
    const fresh = orders.filter((o) => o.status === 'new').map((o) => o.id)
    if (known.current && sound && fresh.some((id) => !known.current!.has(id))) chime()
    known.current = new Set(fresh)
    const n = fresh.length
    document.title = n > 0 ? `(${n}) Commandes — Administration` : 'Commandes — Administration'
  }, [orders, sound])

  const run = (id: number, status: OrderStatus) =>
    start(async () => {
      setState(await updateOrderStatus(id, status))
      router.refresh()
    })

  return (
    <>
      {live && (
        <div className="adm-row" style={{ marginBottom: 16 }}>
          <label className="adm-switch">
            <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} />
            <span>
              Alerte sonore à chaque nouvelle commande
              <small>Actualisation automatique toutes les 15 secondes.</small>
            </span>
          </label>
        </div>
      )}
      {orders.length === 0 ? (
        <p className="adm-empty">Aucune commande pour le moment.</p>
      ) : (
        <div className="adm-orders">
          {orders.map((o) => (
            <article key={o.id} className="adm-order" data-status={o.status}>
              <div className="adm-order-head">
                <span className="adm-order-ref">{o.ref}</span>
                <span
                  className="adm-tag"
                  data-tone={o.status === 'new' ? 'sun' : o.status === 'cancelled' ? 'off' : undefined}
                >
                  {ORDER_STATUS_LABELS[o.status]}
                </span>
              </div>
              <div>
                <span className="adm-order-time">Retrait {o.pickupLabel}</span>
                <p className="adm-sub" style={{ marginTop: 0 }}>
                  {o.customerName} · <a href={`tel:${o.phone.replace(/[^+0-9]/g, '')}`}>{o.phone}</a> · reçue{' '}
                  {o.createdLabel}
                </p>
              </div>
              <ul>
                {o.items.map((it, i) => (
                  <li key={i}>
                    <span>
                      <strong>{it.quantity}×</strong> {it.name}
                      {it.label && ` (${it.label})`}
                    </span>
                    <span>{it.total}</span>
                  </li>
                ))}
              </ul>
              {o.note && <p className="adm-alert">{o.note}</p>}
              <div className="adm-order-total">
                <span>Total</span>
                <span>{o.total}</span>
              </div>
              <div className="adm-order-btns">
                {NEXT[o.status] && (
                  <button
                    type="button"
                    className="adm-btn adm-btn--primary adm-btn--small"
                    disabled={pending}
                    onClick={() => run(o.id, NEXT[o.status]!.status)}
                  >
                    {NEXT[o.status]!.label}
                  </button>
                )}
                {o.status !== 'cancelled' && o.status !== 'done' && (
                  <button
                    type="button"
                    className="adm-btn adm-btn--small adm-btn--danger"
                    disabled={pending}
                    onClick={() => window.confirm(`Annuler la commande ${o.ref} ?`) && run(o.id, 'cancelled')}
                  >
                    Annuler
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      <Toast state={state} />
    </>
  )
}
