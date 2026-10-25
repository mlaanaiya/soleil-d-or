import { DAYS, DAY_LABELS, type Day, type Hours, type Slot } from './schemas'

export const TIMEZONE = 'Europe/Paris'

export type ZonedNow = { date: string; minutes: number }

/** Current wall-clock date and minute-of-day in the restaurant's timezone. */
export function zonedNow(at: Date = new Date(), timeZone = TIMEZONE): ZonedNow {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  }
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export function formatMinutes(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** Human French time: "11h", "14h30". */
export function formatTimeFr(time: string): string {
  const [h, m] = time.split(':')
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`
}

/** "11h – 14h30"; an opening equal to its closing time is a 24-hour service. */
export function formatSlot(slot: Slot): string {
  return slot.open === slot.close ? '24 h/24' : `${formatTimeFr(slot.open)} – ${formatTimeFr(slot.close)}`
}

export function formatSlots(slots: Slot[]): string {
  return slots.length === 0 ? 'Fermé' : slots.map(formatSlot).join(' · ')
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const t = new Date(Date.UTC(y!, m! - 1, d! + days))
  return t.toISOString().slice(0, 10)
}

export function dayOf(date: string): Day {
  const [y, m, d] = date.split('-').map(Number)
  const js = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay() // 0 = Sunday
  return DAYS[(js + 6) % 7]!
}

export function hasHours(hours: Hours): boolean {
  return DAYS.some((d) => hours.week[d].length > 0)
}

/** Slots for a given date, honouring exceptional days. */
export function slotsFor(hours: Hours, date: string): Slot[] {
  const exception = hours.exceptions.find((e) => e.date === date)
  if (exception) return exception.slots
  return hours.week[dayOf(date)]
}

export function exceptionFor(hours: Hours, date: string) {
  return hours.exceptions.find((e) => e.date === date) ?? null
}

/** Opening intervals in minutes from the start of `date`; a slot closing after midnight extends past 1440. */
export function intervalsFor(hours: Hours, date: string): Array<[number, number]> {
  return slotsFor(hours, date).map(({ open, close }) => {
    const start = toMinutes(open)
    let end = toMinutes(close)
    if (end <= start) end += 1440
    return [start, end] as [number, number]
  })
}

export type OpenStatus =
  | { state: 'unknown' }
  | { state: 'open'; closesAt: string; allDay?: boolean }
  | {
      state: 'closed'
      opensAt: { date: string; time: string; dayLabel: string; relative: 'today' | 'tomorrow' | 'later' } | null
    }

export function getOpenStatus(hours: Hours, at: Date = new Date()): OpenStatus {
  if (!hasHours(hours) && hours.exceptions.length === 0) return { state: 'unknown' }
  const now = zonedNow(at)

  // Service started yesterday and still running after midnight.
  for (const [start, end] of intervalsFor(hours, addDays(now.date, -1))) {
    if (end > 1440 && now.minutes + 1440 >= start && now.minutes + 1440 < end) {
      return { state: 'open', closesAt: formatMinutes(end) }
    }
  }
  for (const [start, end] of intervalsFor(hours, now.date)) {
    if (now.minutes >= start && now.minutes < end) {
      return end - start >= 1440
        ? { state: 'open', closesAt: formatMinutes(end), allDay: true }
        : { state: 'open', closesAt: formatMinutes(end) }
    }
  }

  for (let offset = 0; offset < 8; offset++) {
    const date = addDays(now.date, offset)
    const upcoming = intervalsFor(hours, date)
      .map(([start]) => start)
      .filter((start) => offset > 0 || start > now.minutes)
      .sort((a, b) => a - b)
    if (upcoming.length > 0) {
      return {
        state: 'closed',
        opensAt: {
          date,
          time: formatMinutes(upcoming[0]!),
          dayLabel: DAY_LABELS[dayOf(date)],
          relative: offset === 0 ? 'today' : offset === 1 ? 'tomorrow' : 'later',
        },
      }
    }
  }
  return { state: 'closed', opensAt: null }
}

export type TimeOption = { value: string; label: string }

function roundUp(minutes: number, step: number) {
  return Math.ceil(minutes / step) * step
}

/** Same-day pickup slots, starting `leadMinutes` from now, until closing time. */
export function pickupSlots(hours: Hours, at: Date, leadMinutes: number, step: number): TimeOption[] {
  const now = zonedNow(at)
  const earliest = now.minutes + leadMinutes
  const options: TimeOption[] = []
  const push = (date: string, minutes: number) => {
    const realDate = minutes >= 1440 ? addDays(date, 1) : date
    const label = formatMinutes(minutes)
    options.push({ value: `${realDate}T${label}`, label })
  }

  for (const [start, end] of intervalsFor(hours, addDays(now.date, -1))) {
    if (end <= 1440) continue
    for (let t = roundUp(Math.max(start - 1440, earliest), step); t <= end - 1440; t += step) push(now.date, t)
  }
  for (const [start, end] of intervalsFor(hours, now.date)) {
    for (let t = roundUp(Math.max(start, earliest), step); t <= end; t += step) push(now.date, t)
  }
  const seen = new Set<string>()
  return options.filter((o) => (seen.has(o.value) ? false : (seen.add(o.value), true)))
}

/** Reservation start times for a date: the last seating is one step before closing. */
export function reservationSlots(
  hours: Hours,
  date: string,
  at: Date,
  leadMinutes: number,
  step: number,
): TimeOption[] {
  const now = zonedNow(at)
  const dayOffset = daysBetween(now.date, date) * 1440
  const options: TimeOption[] = []
  for (const [start, end] of intervalsFor(hours, date)) {
    for (let t = roundUp(start, step); t + step <= end && t < 1440; t += step) {
      if (dayOffset + t - now.minutes < leadMinutes) continue
      options.push({ value: formatMinutes(t), label: formatTimeFr(formatMinutes(t)) })
    }
  }
  return options
}

export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`)
  const b = Date.parse(`${to}T00:00:00Z`)
  return Math.round((b - a) / 86_400_000)
}

/** Weekly schedule grouped for display: consecutive days with identical slots are merged. */
export function groupedWeek(hours: Hours): Array<{ days: string; slots: Slot[] }> {
  const groups: Array<{ from: Day; to: Day; slots: Slot[] }> = []
  for (const day of DAYS) {
    const slots = hours.week[day]
    const last = groups.at(-1)
    if (last && JSON.stringify(last.slots) === JSON.stringify(slots)) last.to = day
    else groups.push({ from: day, to: day, slots })
  }
  return groups.map((g) => ({
    days: g.from === g.to ? DAY_LABELS[g.from] : `${DAY_LABELS[g.from]} – ${DAY_LABELS[g.to]}`,
    slots: g.slots,
  }))
}

export function describeStatus(status: OpenStatus): string {
  if (status.state === 'unknown') return ''
  if (status.state === 'open')
    return status.allDay ? 'Ouvert 24 h/24' : `Ouvert · jusqu’à ${formatTimeFr(status.closesAt)}`
  if (!status.opensAt) return 'Fermé'
  const when =
    status.opensAt.relative === 'today'
      ? ''
      : status.opensAt.relative === 'tomorrow'
        ? 'demain '
        : `${status.opensAt.dayLabel.toLowerCase()} `
  return `Fermé · ouvre ${when}à ${formatTimeFr(status.opensAt.time)}`
}
