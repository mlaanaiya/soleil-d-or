import { describe, expect, it } from 'vitest'
import {
  addDays,
  dayOf,
  describeStatus,
  formatTimeFr,
  getOpenStatus,
  groupedWeek,
  pickupSlots,
  reservationSlots,
  zonedNow,
} from '@/lib/hours'
import { hoursSchema, type Hours } from '@/lib/schemas'

// 2026-10-26 is a Monday; Paris is UTC+1 after the October DST change.
const paris = (date: string, time: string) => new Date(`${date}T${time}:00+01:00`)

const base: Hours = hoursSchema.parse({
  week: {
    mon: [
      { open: '11:00', close: '14:30' },
      { open: '18:00', close: '23:00' },
    ],
    tue: [{ open: '11:00', close: '23:00' }],
    wed: [],
    thu: [{ open: '11:00', close: '23:00' }],
    fri: [{ open: '18:00', close: '02:00' }],
    sat: [{ open: '18:00', close: '02:00' }],
    sun: [],
  },
})

describe('dates', () => {
  it('computes wall-clock time in Paris', () => {
    expect(zonedNow(paris('2026-10-26', '12:05'))).toEqual({ date: '2026-10-26', minutes: 12 * 60 + 5 })
  })
  it('handles day arithmetic and weekdays', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(dayOf('2026-10-26')).toBe('mon')
    expect(dayOf('2026-11-01')).toBe('sun')
  })
  it('formats French times', () => {
    expect(formatTimeFr('11:00')).toBe('11h')
    expect(formatTimeFr('14:30')).toBe('14h30')
  })
})

describe('getOpenStatus', () => {
  it('is unknown when no hours are configured', () => {
    expect(getOpenStatus(hoursSchema.parse({}), paris('2026-10-26', '12:00')).state).toBe('unknown')
  })
  it('is open during a service and gives closing time', () => {
    expect(getOpenStatus(base, paris('2026-10-26', '12:00'))).toEqual({ state: 'open', closesAt: '14:30' })
  })
  it('is closed between services and announces the next opening today', () => {
    const s = getOpenStatus(base, paris('2026-10-26', '15:00'))
    expect(s).toMatchObject({ state: 'closed', opensAt: { time: '18:00', relative: 'today' } })
    expect(describeStatus(s)).toBe('Fermé · ouvre à 18h')
  })
  it('skips closed days', () => {
    // Tuesday 23:30 → Wednesday closed → Thursday 11:00
    const s = getOpenStatus(base, paris('2026-10-27', '23:30'))
    expect(s).toMatchObject({ state: 'closed', opensAt: { dayLabel: 'Jeudi', relative: 'later' } })
  })
  it('keeps a service open after midnight', () => {
    // Saturday 01:00 belongs to Friday's 18:00–02:00 service
    expect(getOpenStatus(base, paris('2026-10-31', '01:00'))).toEqual({ state: 'open', closesAt: '02:00' })
  })
  it('lets exceptional days override the week', () => {
    const hours = { ...base, exceptions: [{ date: '2026-10-26', label: 'Congés', slots: [] }] }
    expect(getOpenStatus(hours, paris('2026-10-26', '12:00')).state).toBe('closed')
  })
})

describe('pickupSlots', () => {
  it('starts after the preparation delay and rounds to the slot size', () => {
    const slots = pickupSlots(base, paris('2026-10-26', '11:07'), 20, 15)
    expect(slots[0]).toEqual({ value: '2026-10-26T11:30', label: '11:30' })
    expect(slots.some((s) => s.label === '14:30')).toBe(true)
    expect(slots.some((s) => s.label === '14:45')).toBe(false)
    expect(slots.at(-1)?.label).toBe('23:00')
  })
  it('is empty when there is no service left today', () => {
    expect(pickupSlots(base, paris('2026-10-28', '12:00'), 20, 15)).toEqual([])
  })
  it('dates slots after midnight on the next day', () => {
    const slots = pickupSlots(base, paris('2026-10-30', '23:40'), 20, 15)
    expect(slots[0]).toEqual({ value: '2026-10-31T00:00', label: '00:00' })
    expect(slots.at(-1)).toEqual({ value: '2026-10-31T02:00', label: '02:00' })
  })
})

describe('reservationSlots', () => {
  it('respects the lead time and seats the last table one slot before closing', () => {
    const slots = reservationSlots(base, '2026-10-26', paris('2026-10-26', '10:00'), 120, 30).map((s) => s.value)
    expect(slots[0]).toBe('12:00')
    expect(slots).toContain('14:00')
    expect(slots).not.toContain('14:30')
    expect(slots.at(-1)).toBe('22:30')
  })
  it('refuses past dates', () => {
    expect(reservationSlots(base, '2026-10-19', paris('2026-10-26', '10:00'), 0, 30)).toEqual([])
  })
})

describe('groupedWeek', () => {
  it('merges consecutive identical days', () => {
    const hours = hoursSchema.parse({
      week: {
        mon: [{ open: '11:00', close: '22:00' }],
        tue: [{ open: '11:00', close: '22:00' }],
        wed: [{ open: '11:00', close: '22:00' }],
      },
    })
    expect(groupedWeek(hours).map((g) => g.days)).toEqual(['Lundi – Mercredi', 'Jeudi – Dimanche'])
  })
})

describe('24-hour service', () => {
  it('is displayed as 24 h/24 and reported as open all day', () => {
    const hours = hoursSchema.parse({ week: { mon: [{ open: '00:00', close: '00:00' }] } })
    expect(groupedWeek(hours)[0]!.slots).toHaveLength(1)
    const status = getOpenStatus(hours, paris('2026-10-26', '15:00'))
    expect(describeStatus(status)).toBe('Ouvert 24 h/24')
  })
})
