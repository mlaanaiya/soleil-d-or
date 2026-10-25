import 'server-only'
import { db } from './db'
import { getProduct } from './catalog'
import { getSetting } from './settings'
import { humanRef, secretToken } from './security'
import { daysBetween, pickupSlots, reservationSlots, zonedNow } from '../hours'
import type { OrderInput, OrderStatus, ReservationInput, ReservationStatus } from '../schemas'
import type { OrderItem } from '../types'

export class BookingError extends Error {}

function uniqueRef(table: 'orders' | 'reservations'): string {
  for (let i = 0; i < 20; i++) {
    const ref = humanRef(6)
    if (!db().prepare(`SELECT 1 FROM ${table} WHERE ref = ?`).get(ref)) return ref
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
  items: string
  total_cents: number
  note: string
  status: OrderStatus
  created_at: string
  updated_at: string
}

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    ref: row.ref,
    token: row.token,
    customerName: row.customer_name,
    phone: row.phone,
    pickupAt: row.pickup_at,
    items: JSON.parse(row.items) as OrderItem[],
    totalCents: row.total_cents,
    note: row.note,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Resolves cart lines against the live catalogue; client-side prices are never trusted. */
export function priceCart(lines: OrderInput['items']): { items: OrderItem[]; totalCents: number } {
  const merged = new Map<string, OrderInput['items'][number]>()
  for (const line of lines) {
    const key = `${line.productId}:${line.priceIndex}`
    const existing = merged.get(key)
    merged.set(key, existing ? { ...existing, quantity: Math.min(20, existing.quantity + line.quantity) } : line)
  }
  const items: OrderItem[] = []
  for (const line of merged.values()) {
    const product = getProduct(line.productId)
    if (!product || !product.visible) throw new BookingError('Un produit de votre panier n’est plus proposé.')
    if (!product.available) throw new BookingError(`« ${product.name} » est momentanément indisponible.`)
    const price = product.prices[line.priceIndex]
    if (!price) throw new BookingError(`Le prix de « ${product.name} » a changé, mettez à jour votre panier.`)
    items.push({ productId: product.id, name: product.name, label: price.label, cents: price.cents, quantity: line.quantity })
  }
  return { items, totalCents: items.reduce((sum, i) => sum + i.cents * i.quantity, 0) }
}

export function createOrder(input: OrderInput, at: Date = new Date()): { ref: string; token: string } {
  const services = getSetting('services')
  if (!services.ordering.enabled) throw new BookingError('La commande en ligne n’est pas disponible.')
  const slots = pickupSlots(getSetting('hours'), at, services.ordering.leadMinutes, services.ordering.slotMinutes)
  if (!slots.some((s) => s.value === input.pickupAt)) {
    throw new BookingError('Ce créneau de retrait n’est plus disponible, choisissez-en un autre.')
  }
  const { items, totalCents } = priceCart(input.items)
  const ref = uniqueRef('orders')
  const token = secretToken()
  db()
    .prepare(
      `INSERT INTO orders (ref, token, customer_name, phone, pickup_at, items, total_cents, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(ref, token, input.name, input.phone, input.pickupAt, JSON.stringify(items), totalCents, input.note)
  return { ref, token }
}

export function getOrderForCustomer(ref: string, token: string): Order | null {
  const row = db().prepare('SELECT * FROM orders WHERE ref = ? AND token = ?').get(ref, token) as OrderRow | undefined
  return row ? toOrder(row) : null
}

export function listOrders(scope: 'active' | 'archive'): Order[] {
  const rows = db()
    .prepare(
      scope === 'active'
        ? "SELECT * FROM orders WHERE status IN ('new', 'accepted', 'ready') ORDER BY pickup_at, id"
        : "SELECT * FROM orders WHERE status IN ('done', 'cancelled') ORDER BY id DESC LIMIT 200",
    )
    .all() as OrderRow[]
  return rows.map(toOrder)
}

export function setOrderStatus(id: number, status: OrderStatus) {
  db().prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id)
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
  created_at: string
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
    createdAt: row.created_at,
  }
}

export function createReservation(input: ReservationInput, at: Date = new Date()): { ref: string; token: string } {
  const { reservations } = getSetting('services')
  if (!reservations.enabled) throw new BookingError('La réservation en ligne n’est pas disponible.')
  if (input.partySize > reservations.maxParty) {
    throw new BookingError(`Au-delà de ${reservations.maxParty} personnes, contactez-nous directement.`)
  }
  const ahead = daysBetween(zonedNow(at).date, input.date)
  if (ahead < 0 || ahead > reservations.maxDaysAhead) throw new BookingError('Cette date n’est pas réservable.')
  const slots = reservationSlots(getSetting('hours'), input.date, at, reservations.leadMinutes, reservations.slotMinutes)
  if (!slots.some((s) => s.value === input.time)) {
    throw new BookingError('Cet horaire n’est pas disponible, choisissez-en un autre.')
  }
  const ref = uniqueRef('reservations')
  const token = secretToken()
  db()
    .prepare(
      `INSERT INTO reservations (ref, token, name, phone, email, date, time, party_size, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(ref, token, input.name, input.phone, input.email, input.date, input.time, input.partySize, input.note)
  return { ref, token }
}

export function getReservationForCustomer(ref: string, token: string): Reservation | null {
  const row = db().prepare('SELECT * FROM reservations WHERE ref = ? AND token = ?').get(ref, token) as
    | ReservationRow
    | undefined
  return row ? toReservation(row) : null
}

export function listReservations(scope: 'upcoming' | 'past', today: string): Reservation[] {
  const rows = db()
    .prepare(
      scope === 'upcoming'
        ? 'SELECT * FROM reservations WHERE date >= ? ORDER BY date, time, id'
        : 'SELECT * FROM reservations WHERE date < ? ORDER BY date DESC, time DESC LIMIT 200',
    )
    .all(today) as ReservationRow[]
  return rows.map(toReservation)
}

export function setReservationStatus(id: number, status: ReservationStatus) {
  db().prepare("UPDATE reservations SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id)
}

export function pendingCounts(): { orders: number; reservations: number } {
  const orders = (db().prepare("SELECT COUNT(*) AS n FROM orders WHERE status = 'new'").get() as { n: number }).n
  const reservations = (
    db().prepare("SELECT COUNT(*) AS n FROM reservations WHERE status = 'pending'").get() as { n: number }
  ).n
  return { orders, reservations }
}
