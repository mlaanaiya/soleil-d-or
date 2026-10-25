'use client'

import { useState } from 'react'
import { saveHours } from '@/app/admin/_actions/settings'
import { DAYS, DAY_LABELS, type Day, type Hours, type Slot } from '@/lib/schemas'
import { Toast } from './Toast'
import { useAdminForm } from './useAdminForm'

function SlotList({ slots, onChange }: { slots: Slot[]; onChange: (s: Slot[]) => void }) {
  return (
    <div className="adm-slots">
      {slots.length === 0 && <p className="adm-closed">Fermé</p>}
      {slots.map((s, i) => (
        <div className="adm-slot" key={i}>
          <input
            className="adm-input"
            type="time"
            value={s.open}
            onChange={(e) => onChange(slots.map((x, j) => (j === i ? { ...x, open: e.target.value } : x)))}
            aria-label="Ouverture"
          />
          <span>à</span>
          <input
            className="adm-input"
            type="time"
            value={s.close}
            onChange={(e) => onChange(slots.map((x, j) => (j === i ? { ...x, close: e.target.value } : x)))}
            aria-label="Fermeture"
          />
          {s.close <= s.open && s.close !== '' && <small className="adm-sub">(après minuit)</small>}
          <button
            type="button"
            className="adm-icon-btn"
            onClick={() => onChange(slots.filter((_, j) => j !== i))}
            aria-label="Retirer ce service"
          >
            ✕
          </button>
        </div>
      ))}
      <div>
        <button
          type="button"
          className="adm-btn adm-btn--small"
          disabled={slots.length >= 4}
          onClick={() =>
            onChange([...slots, { open: slots.length ? '18:00' : '11:00', close: slots.length ? '23:00' : '14:30' }])
          }
        >
          + {slots.length ? 'Ajouter un service' : 'Ouvrir ce jour'}
        </button>
      </div>
    </div>
  )
}

export function HoursEditor({ initial }: { initial: Hours }) {
  const [hours, setHours] = useState<Hours>(initial)
  const [state, onSubmit, pending] = useAdminForm(saveHours)
  const setDay = (d: Day, slots: Slot[]) => setHours((h) => ({ ...h, week: { ...h.week, [d]: slots } }))
  const copyMonday = () =>
    setHours((h) => ({ ...h, week: Object.fromEntries(DAYS.map((d) => [d, h.week.mon])) as Hours['week'] }))

  return (
    <form onSubmit={onSubmit} className="adm-form">
      <input type="hidden" name="payload" value={JSON.stringify(hours)} />
      <section className="adm-card">
        <div className="adm-row" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2>Semaine type</h2>
            <p className="adm-card-sub">
              Deux services possibles par jour (midi et soir). Une fermeture après minuit est acceptée (ex. 18:00 à
              01:00).
            </p>
          </div>
          <button type="button" className="adm-btn adm-btn--small" onClick={copyMonday}>
            Copier le lundi sur toute la semaine
          </button>
        </div>
        {DAYS.map((d) => (
          <div className="adm-day" key={d}>
            <div className="adm-day-name">{DAY_LABELS[d]}</div>
            <SlotList slots={hours.week[d]} onChange={(s) => setDay(d, s)} />
          </div>
        ))}
      </section>

      <section className="adm-card">
        <h2>Jours exceptionnels</h2>
        <p className="adm-card-sub">
          Jours fériés, congés, horaires spéciaux : ils remplacent la semaine type pour la date indiquée.
        </p>
        {hours.exceptions.map((e, i) => (
          <div className="adm-day" key={i}>
            <div className="adm-form" style={{ gap: 8 }}>
              <input
                className="adm-input"
                type="date"
                value={e.date}
                onChange={(ev) =>
                  setHours((h) => ({
                    ...h,
                    exceptions: h.exceptions.map((x, j) => (j === i ? { ...x, date: ev.target.value } : x)),
                  }))
                }
                aria-label="Date"
              />
              <input
                className="adm-input"
                placeholder="Motif (facultatif)"
                value={e.label}
                onChange={(ev) =>
                  setHours((h) => ({
                    ...h,
                    exceptions: h.exceptions.map((x, j) => (j === i ? { ...x, label: ev.target.value } : x)),
                  }))
                }
                aria-label="Motif"
              />
              <button
                type="button"
                className="adm-btn adm-btn--small adm-btn--danger"
                onClick={() => setHours((h) => ({ ...h, exceptions: h.exceptions.filter((_, j) => j !== i) }))}
              >
                Retirer ce jour
              </button>
            </div>
            <SlotList
              slots={e.slots}
              onChange={(s) =>
                setHours((h) => ({ ...h, exceptions: h.exceptions.map((x, j) => (j === i ? { ...x, slots: s } : x)) }))
              }
            />
          </div>
        ))}
        <button
          type="button"
          className="adm-btn adm-btn--small"
          onClick={() =>
            setHours((h) => ({
              ...h,
              exceptions: [...h.exceptions, { date: new Date().toISOString().slice(0, 10), label: '', slots: [] }],
            }))
          }
        >
          + Ajouter un jour exceptionnel
        </button>
      </section>

      <section className="adm-card">
        <label className="adm-field">
          <span>
            Note <small>— facultatif, affichée sous les horaires (ex. « Service continu le week-end »)</small>
          </span>
          <input
            className="adm-input"
            maxLength={240}
            value={hours.note}
            onChange={(e) => setHours((h) => ({ ...h, note: e.target.value }))}
          />
        </label>
      </section>

      <div className="adm-actions">
        <button type="submit" className="adm-btn adm-btn--primary" disabled={pending}>
          {pending ? 'Enregistrement…' : 'Enregistrer les horaires'}
        </button>
      </div>
      <Toast state={state} />
    </form>
  )
}
