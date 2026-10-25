'use client'

import { useSyncExternalStore } from 'react'

/**
 * Click & collect basket. It only stores identifiers and quantities: names and prices shown in the
 * basket are re-read from the live menu, and the server recomputes everything at checkout.
 */
export type CartLine = { productId: number; priceIndex: number; quantity: number }

const KEY = 'sdo:cart'
const listeners = new Set<() => void>()
let cache: CartLine[] | null = null
const EMPTY: CartLine[] = []

function read(): CartLine[] {
  if (cache) return cache
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown
    cache = Array.isArray(raw)
      ? raw.filter(
          (l): l is CartLine =>
            typeof l === 'object' &&
            l !== null &&
            Number.isInteger(l.productId) &&
            Number.isInteger(l.priceIndex) &&
            Number.isInteger(l.quantity),
        )
      : []
  } catch {
    cache = []
  }
  return cache
}

function write(lines: CartLine[]) {
  cache = lines.filter((l) => l.quantity > 0).map((l) => ({ ...l, quantity: Math.min(20, l.quantity) }))
  try {
    localStorage.setItem(KEY, JSON.stringify(cache))
  } catch {
    /* storage unavailable: the basket lives in memory for this visit */
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null
      listener()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function useCart(): CartLine[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY)
}

export const cart = {
  add(productId: number, priceIndex: number, quantity = 1) {
    const lines = [...read()]
    const existing = lines.find((l) => l.productId === productId && l.priceIndex === priceIndex)
    if (existing) existing.quantity += quantity
    else lines.push({ productId, priceIndex, quantity })
    write(lines.map((l) => ({ ...l })))
  },
  set(productId: number, priceIndex: number, quantity: number) {
    write(read().map((l) => (l.productId === productId && l.priceIndex === priceIndex ? { ...l, quantity } : l)))
  },
  clear() {
    write([])
  },
}

export function cartCount(lines: CartLine[]) {
  return lines.reduce((n, l) => n + l.quantity, 0)
}
