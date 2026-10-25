'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { placeReservation } from '@/app/(site)/commander/actions'
import type { TimeOption } from '@/lib/hours'
import styles from './Booking.module.css'

export type ReservableDay = { date: string; label: string; short: string; slots: TimeOption[] }

export function ReservationForm({ days, maxParty, note }: { days: ReservableDay[]; maxParty: number; note: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const firstOpen = days.find((d) => d.slots.length > 0)
  const [date, setDate] = useState(firstOpen?.date ?? '')
  const [time, setTime] = useState('')
  const [party, setParty] = useState(2)
  const [error, setError] = useState<string | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const day = days.find((d) => d.date === date)

  const submit = (form: FormData) => {
    setError(null)
    setFields({})
    const payload = {
      name: String(form.get('name') ?? ''),
      phone: String(form.get('phone') ?? ''),
      email: String(form.get('email') ?? ''),
      note: String(form.get('note') ?? ''),
      date,
      time,
      partySize: party,
    }
    if (!time) {
      setFields({ time: 'Choisissez un horaire' })
      return
    }
    startTransition(async () => {
      const result = await placeReservation(payload, String(form.get('website') ?? ''))
      if (result.ok) router.push(result.url)
      else {
        setError(result.error)
        setFields(result.fields ?? {})
      }
    })
  }

  if (!firstOpen) {
    return <p className={styles.closed}>Aucun créneau n’est ouvert à la réservation pour le moment.</p>
  }

  return (
    <form action={submit} className={styles.resaForm} noValidate>
      <fieldset className={styles.fieldset}>
        <legend>Date</legend>
        <div className={styles.dayChips}>
          {days.map((d) => (
            <button
              key={d.date}
              type="button"
              className={styles.dayChip}
              aria-pressed={d.date === date}
              disabled={d.slots.length === 0}
              onClick={() => {
                setDate(d.date)
                setTime('')
              }}
            >
              <span>{d.short}</span>
              <strong>{d.label}</strong>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>Horaire</legend>
        <div className={styles.timeChips}>
          {day?.slots.map((s) => (
            <button
              key={s.value}
              type="button"
              className={styles.timeChip}
              aria-pressed={time === s.value}
              onClick={() => setTime(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
        {fields.time && <em className={styles.fieldError}>{fields.time}</em>}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>Nombre de personnes</legend>
        <div className={styles.partyStepper}>
          <button type="button" onClick={() => setParty((p) => Math.max(1, p - 1))} aria-label="Une personne de moins">
            −
          </button>
          <output aria-live="polite">
            {party} <span>{party > 1 ? 'personnes' : 'personne'}</span>
          </output>
          <button
            type="button"
            onClick={() => setParty((p) => Math.min(maxParty, p + 1))}
            aria-label="Une personne de plus"
          >
            +
          </button>
        </div>
      </fieldset>

      <div className={styles.resaFields}>
        <label className={styles.field}>
          <span>Nom</span>
          <input name="name" autoComplete="name" required maxLength={60} aria-invalid={Boolean(fields.name)} />
          {fields.name && <em>{fields.name}</em>}
        </label>
        <label className={styles.field}>
          <span>Téléphone</span>
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            maxLength={24}
            aria-invalid={Boolean(fields.phone)}
          />
          {fields.phone && <em>{fields.phone}</em>}
        </label>
        <label className={styles.field}>
          <span>E-mail (facultatif)</span>
          <input name="email" type="email" autoComplete="email" maxLength={160} aria-invalid={Boolean(fields.email)} />
          {fields.email && <em>{fields.email}</em>}
        </label>
        <label className={styles.field}>
          <span>Précisions (facultatif)</span>
          <textarea name="note" rows={2} maxLength={300} />
        </label>
      </div>
      <label className={styles.honeypot} aria-hidden="true">
        Site web
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      {note && <p className={styles.formNote}>{note}</p>}
      <p className={styles.formNote}>Votre demande sera confirmée par le restaurant.</p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn" disabled={pending}>
        {pending ? 'Envoi…' : 'Demander la réservation'}
      </button>
    </form>
  )
}
