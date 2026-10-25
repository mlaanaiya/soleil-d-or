import { beforeAll, describe, expect, it } from 'vitest'
import { createTempDataDir } from './setup-db'

createTempDataDir()

const { db } = await import('@/lib/server/db')
const catalog = await import('@/lib/server/catalog')
const bookings = await import('@/lib/server/bookings')
const security = await import('@/lib/server/security')
const settings = await import('@/lib/server/settings')

// Monday 2026-10-26, 12:00 in Paris (UTC+1).
const NOON = new Date('2026-10-26T12:00:00+01:00')

let burgerId = 0
let soldOutId = 0
let categoryId = 0

beforeAll(() => {
  categoryId = catalog.createCategory({
    name: 'Burgers',
    slug: 'burgers',
    tagline: '',
    description: '',
    coverMediaId: null,
    visible: true,
  })
  const base = {
    categoryId,
    description: '',
    details: '',
    photoMediaId: null,
    cutoutMediaId: null,
    visible: true,
    featured: false,
    badge: '',
  }
  burgerId = catalog.createProduct({
    ...base,
    name: 'Burger',
    slug: 'burger',
    available: true,
    prices: [
      { label: 'Seul', cents: 850 },
      { label: 'Menu', cents: 1100 },
    ],
  })
  soldOutId = catalog.createProduct({
    ...base,
    name: 'Rupture',
    slug: 'rupture',
    available: false,
    prices: [{ label: '', cents: 500 }],
  })
  catalog.createProduct({ ...base, name: 'Sans prix', slug: 'sans-prix', available: true, prices: [] })
  settings.setSetting('hours', { week: { mon: [{ open: '11:00', close: '23:00' }] } })
})

describe('schema & settings', () => {
  it('migrates to the latest schema version', () => {
    expect(db().pragma('user_version', { simple: true })).toBe(1)
  })
  it('falls back to defaults when a stored document is corrupted', () => {
    db().prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('content', '{not json')").run()
    expect(settings.getSetting('content').heroTagline).toBeTruthy()
  })
  it('validates settings on write', () => {
    expect(() => settings.setSetting('restaurant', { email: 'pas-un-email' })).toThrow()
  })
})

describe('catalogue', () => {
  it('refuses duplicate slugs', () => {
    expect(() =>
      catalog.createProduct({
        name: 'X',
        slug: 'burger',
        categoryId,
        description: '',
        details: '',
        prices: [],
        photoMediaId: null,
        cutoutMediaId: null,
        available: true,
        visible: true,
        featured: false,
        badge: '',
      }),
    ).toThrow(catalog.CatalogError)
  })
  it('protects non-empty categories from deletion', () => {
    expect(() => catalog.deleteCategory(categoryId)).toThrow(/produits/)
  })
  it('reorders products within their category', () => {
    const before = catalog.listProducts({ categoryId }).map((p) => p.slug)
    catalog.move('products', soldOutId, -1)
    const after = catalog.listProducts({ categoryId }).map((p) => p.slug)
    expect(after[0]).toBe(before[1])
    expect(after[1]).toBe(before[0])
  })
  it('hides invisible products from the public menu', () => {
    catalog.setProductFlag(soldOutId, 'visible', false)
    expect(catalog.getMenu()[0]!.products.map((p) => p.slug)).not.toContain('rupture')
    catalog.setProductFlag(soldOutId, 'visible', true)
  })
})

describe('orders', () => {
  const order = (over: object = {}) => ({
    name: 'Alex',
    phone: '06 00 00 00 00',
    pickupAt: '2026-10-26T12:30',
    note: '',
    items: [{ productId: burgerId, priceIndex: 1, quantity: 2 }],
    ...over,
  })

  it('is refused while online ordering is disabled', () => {
    expect(() => bookings.createOrder(order(), NOON)).toThrow(/pas disponible/)
  })

  it('recomputes prices on the server and stores a snapshot', () => {
    settings.setSetting('services', { ordering: { enabled: true, leadMinutes: 20, slotMinutes: 15 } })
    const { ref, token } = bookings.createOrder(order(), NOON)
    const saved = bookings.getOrderForCustomer(ref, token)!
    expect(saved.totalCents).toBe(2200)
    expect(saved.items).toEqual([{ productId: burgerId, name: 'Burger', label: 'Menu', cents: 1100, quantity: 2 }])
    expect(bookings.getOrderForCustomer(ref, 'wrong-token')).toBeNull()
  })

  it('merges duplicate lines', () => {
    const lines = bookings.priceCart([
      { productId: burgerId, priceIndex: 0, quantity: 1 },
      { productId: burgerId, priceIndex: 0, quantity: 2 },
    ])
    expect(lines.items).toHaveLength(1)
    expect(lines.totalCents).toBe(2550)
  })

  it('rejects unavailable products, unknown price options and invalid slots', () => {
    expect(() =>
      bookings.createOrder(order({ items: [{ productId: soldOutId, priceIndex: 0, quantity: 1 }] }), NOON),
    ).toThrow(/indisponible/)
    expect(() =>
      bookings.createOrder(order({ items: [{ productId: burgerId, priceIndex: 5, quantity: 1 }] }), NOON),
    ).toThrow(/prix/)
    expect(() => bookings.createOrder(order({ pickupAt: '2026-10-26T12:05' }), NOON)).toThrow(/créneau/)
    expect(() => bookings.createOrder(order({ pickupAt: '2026-10-26T23:30' }), NOON)).toThrow(/créneau/)
  })

  it('lists active orders and moves them through statuses', () => {
    const active = bookings.listOrders('active')
    expect(active.length).toBeGreaterThan(0)
    bookings.setOrderStatus(active[0]!.id, 'done')
    expect(bookings.listOrders('archive').some((o) => o.id === active[0]!.id)).toBe(true)
  })
})

describe('reservations', () => {
  const resa = (over: object = {}) => ({
    name: 'Sam',
    phone: '0600000000',
    email: '',
    date: '2026-10-26',
    time: '19:00',
    partySize: 4,
    note: '',
    ...over,
  })

  it('is refused while disabled, then validates party size and slots', () => {
    expect(() => bookings.createReservation(resa(), NOON)).toThrow(/pas disponible/)
    settings.setSetting('services', {
      reservations: { enabled: true, maxParty: 6, slotMinutes: 30, leadMinutes: 60, maxDaysAhead: 14 },
    })
    expect(() => bookings.createReservation(resa({ partySize: 9 }), NOON)).toThrow(/6 personnes/)
    expect(() => bookings.createReservation(resa({ time: '12:30' }), NOON)).toThrow(/horaire/)
    expect(() => bookings.createReservation(resa({ date: '2026-10-27' }), NOON)).toThrow(/horaire/) // Tuesday: closed
    expect(() => bookings.createReservation(resa({ date: '2026-12-31' }), NOON)).toThrow(/date/)
    const { ref, token } = bookings.createReservation(resa(), NOON)
    expect(bookings.getReservationForCustomer(ref, token)?.status).toBe('pending')
  })
})

describe('security', () => {
  it('hashes and verifies passwords with scrypt', () => {
    const hash = security.hashPassword('une phrase de passe')
    expect(hash.startsWith('scrypt$')).toBe(true)
    expect(security.verifyPassword('une phrase de passe', hash)).toBe(true)
    expect(security.verifyPassword('mauvais', hash)).toBe(false)
  })
  it('enforces a minimum password length', () => {
    expect(() => security.upsertUser('admin', 'court')).toThrow()
  })
  it('authenticates users and manages sessions', () => {
    security.upsertUser('gerant', 'mot-de-passe-solide')
    const user = security.findUserByCredentials('GERANT', 'mot-de-passe-solide')!
    expect(user.username).toBe('gerant')
    expect(security.findUserByCredentials('gerant', 'nope')).toBeNull()
    expect(security.findUserByCredentials('inconnu', 'mot-de-passe-solide')).toBeNull()
    const { token } = security.createSession(user.id)
    expect(security.userForSession(token)?.id).toBe(user.id)
    security.destroySession(token)
    expect(security.userForSession(token)).toBeNull()
  })
  it('rate-limits repeated attempts', () => {
    const results = Array.from({ length: 4 }, () => security.rateLimit('test:key', 3, 60_000))
    expect(results).toEqual([true, true, true, false])
  })
  it('generates unambiguous references', () => {
    expect(security.humanRef()).toMatch(/^[A-HJ-NP-Z2-9]{6}$/)
  })
})
