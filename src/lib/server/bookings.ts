import 'server-only'
import { iso, one, query } from './db'
import { getProduct } from './catalog'
import { getSetting } from './settings'
import { humanRef, secretToken } from './security'
import { daysBetween, pickupSlots, reservationSlots, zonedNow } from '../hours'
import type { OrderInput, OrderStatus, ReservationInput, ReservationStatus } from '../schemas'
import type { OrderItem } from '../types'

export class BookingError extends Error {}

async function uniqueRef(table: 'orders' | 'reservations'): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const ref = humanRef(6)
    if (!(await one(`SELECT 1 FROM ${table} WHERE ref = $1`, [ref]))) return ref
  }
  throw new BookingError('Impossible de générer une référence, réessayez.')
}

/* ------------------------------ Orders ----------------------------- */

export type Order = {
  id: number
  ref: string
  token: string
  customerName: string
  phone: string
  pickupAt: string
  items: OrderItem[]
  totalCents: number
  note: string
  status: OrderStatus
  createdAt: string
  updatedAt: string
}

type OrderRow = {
  id: number
  ref: string
  token: string
  customer_name: string
  phone: string
  pickup_at: string
  items: OrderItem[]
  total_cents: number
  note: string
  status: OrderStatus
  created_at: Date | string
  updated_at: Date | string
}

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    ref: row.ref,
    token: row.token,
    customerName: row.customer_name,
    phone: row.phone,
    pickupAt: row.pickup_at,
    items: row.items,
    totalCents: row.total_cents,
    note: row.note,
    status: row.status,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  }
}

/** Resolves cart lines against the live catalogue; client-side prices are never trusted. */
export async function priceCart(lines: OrderInput['items']): Promise<{ items: OrderItem[]; totalCents: number }> {
  const merged = new Map<string, OrderInput['items'][number]>()
  for (const line of lines) {
    const key = `${line.productId}:${line.priceIndex}`
    const existing = merged.get(key)
    merged.set(key, existing ? { ...existing, quantity: Math.min(20, existing.quantity + line.quantity) } : line)
  }
  const items: OrderItem[] = []
  for (const line of merged.values()) {
    const product = await getProduct(line.productId)
    if (!product || !product.visible) throw new BookingError('Un produit de votre panier n’est plus proposé.')
    if (!product.available) throw new BookingError(`« ${product.name} » est momentanément indisponible.`)
    const price = product.prices[line.priceIndex]
    if (!price) throw new BookingError(`Le prix de « ${product.name} » a changé, mettez à jour votre panier.`)
    items.push({
      productId: product.id,
      name: product.name,
      label: price.label,
      cents: price.cents,
      quantity: line.quantity,
    })
  }
  return { items, totalCents: items.reduce((sum, i) => sum + i.cents * i.quantity, 0) }
}

export async function createOrder(input: OrderInput, at: Date = new Date()): Promise<{ ref: string; token: string }> {
  const [services, hours] = await Promise.all([getSetting('services'), getSetting('hours')])
  if (!services.ordering.enabled) throw new BookingError('La commande en ligne n’est pas disponible.')
  const slots = pickupSlots(hours, at, services.ordering.leadMinutes, services.ordering.slotMinutes)
  if (!slots.some((s) => s.value === input.pickupAt)) {
    throw new BookingError('Ce créneau de retrait n’est plus disponible, choisissez-en un autre.')
  }
  const { items, totalCents } = await priceCart(input.items)
  const ref = await uniqueRef('orders')
  const token = secretToken()
  await query(
    `INSERT INTO orders (ref, token, customer_name, phone, pickup_at, items, total_cents, note)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)`,
    [ref, token, input.name, input.phone, input.pickupAt, JSON.stringify(items), totalCents, input.note],
  )
  return { ref, token }
}

export async function getOrderForCustomer(ref: string, token: string): Promise<Order | null> {
  const row = await one<OrderRow>('SELECT * FROM orders WHERE ref = $1 AND token = $2', [ref, token])
  return row ? toOrder(row) : null
}

export async function listOrders(scope: 'active' | 'archive'): Promise<Order[]> {
  const rows = await query<OrderRow>(
    scope === 'active'
      ? "SELECT * FROM orders WHERE status IN ('new', 'accepted', 'ready') ORDER BY pickup_at, id"
      : "SELECT * FROM orders WHERE status IN ('done', 'cancelled') ORDER BY id DESC LIMIT 200",
  )
  return rows.map(toOrder)
}

export async function setOrderStatus(id: number, status: OrderStatus) {
  await query('UPDATE orders SET status = $1, updated_at = now() WHERE id = $2', [status, id])
}

/* --------------------------- Reservations -------------------------- */

export type Reservation = {
  id: number
  ref: string
  token: string
  name: string
  phone: string
  email: string
  date: string
  time: string
  partySize: number
  note: string
  status: ReservationStatus
  createdAt: string
}

type ReservationRow = {
  id: number
  ref: string
  token: string
  name: string
  phone: string
  email: string
  date: string
  time: string
  party_size: number
  note: string
  status: ReservationStatus
  created_at: Date | string
}

function toReservation(row: ReservationRow): Reservation {
  return {
    id: row.id,
    ref: row.ref,
    token: row.token,
    name: row.name,
    phone: row.phone,
    email: row.email,
    date: row.date,
    time: row.time,
    partySize: row.party_size,
    note: row.note,
    status: row.status,
    createdAt: iso(row.created_at),
  }
}

export async function createReservation(
  input: ReservationInput,
  at: Date = new Date(),
): Promise<{ ref: string; token: string }> {
  const [{ reservations }, hours] = await Promise.all([getSetting('services'), getSetting('hours')])
  if (!reservations.enabled) throw new BookingError('La réservation en ligne n’est pas disponible.')
  if (input.partySize > reservations.maxParty) {
    throw new BookingError(`Au-delà de ${reservations.maxParty} personnes, contactez-nous directement.`)
  }
  const ahead = daysBetween(zonedNow(at).date, input.date)
  if (ahead < 0 || ahead > reservations.maxDaysAhead) throw new BookingError('Cette date n’est pas réservable.')
  const slots = reservationSlots(hours, input.date, at, reservations.leadMinutes, reservations.slotMinutes)
  if (!slots.some((s) => s.value === input.time)) {
    throw new BookingError('Cet horaire n’est pas disponible, choisissez-en un autre.')
  }
  const ref = await uniqueRef('reservations')
  const token = secretToken()
  await query(
    `INSERT INTO reservations (ref, token, name, phone, email, date, time, party_size, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [ref, token, input.name, input.phone, input.email, input.date, input.time, input.partySize, input.note],
  )
  return { ref, token }
}

export async function getReservationForCustomer(ref: string, token: string): Promise<Reservation | null> {
  const row = await one<ReservationRow>('SELECT * FROM reservations WHERE ref = $1 AND token = $2', [ref, token])
  return row ? toReservation(row) : null
}

export async function listReservations(scope: 'upcoming' | 'past', today: string): Promise<Reservation[]> {
  const rows = await query<ReservationRow>(
    scope === 'upcoming'
      ? 'SELECT * FROM reservations WHERE date >= $1 ORDER BY date, time, id'
      : 'SELECT * FROM reservations WHERE date < $1 ORDER BY date DESC, time DESC LIMIT 200',
    [today],
  )
  return rows.map(toReservation)
}

export async function setReservationStatus(id: number, status: ReservationStatus) {
  await query('UPDATE reservations SET status = $1, updated_at = now() WHERE id = $2', [status, id])
}

export async function pendingCounts(): Promise<{ orders: number; reservations: number }> {
  const row = await one<{ orders: number; reservations: number }>(
    `SELECT (SELECT COUNT(*) FROM orders WHERE status = 'new')::int AS orders,
            (SELECT COUNT(*) FROM reservations WHERE status = 'pending')::int AS reservations`,
  )
  return row!
}

/** Deletes finished orders and past reservations older than `days` (personal data minimisation). */
export async function purgeBookings(days: number): Promise<number> {
  const orders = await query(
    `DELETE FROM orders WHERE status IN ('done', 'cancelled') AND created_at < now() - make_interval(days => $1::int)
     RETURNING id`,
    [days],
  )
  // Reservation dates are local calendar days (YYYY-MM-DD), compared as text.
  const reservations = await query(
    `DELETE FROM reservations WHERE date < to_char((now() AT TIME ZONE 'Europe/Paris') - make_interval(days => $1::int), 'YYYY-MM-DD')
     RETURNING id`,
    [days],
  )
  return orders.length + reservations.length
}
