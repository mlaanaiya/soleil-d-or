import type { Price } from './schemas'

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

export function formatPrice(cents: number): string {
  return euro.format(cents / 100)
}

/** Lowest price of a product, or null when no price is configured. */
export function fromPrice(prices: Price[]): number | null {
  if (prices.length === 0) return null
  return Math.min(...prices.map((p) => p.cents))
}

/** Parses "8,50", "8.5", "8 €" into cents; returns null when not a valid amount. */
export function parsePriceInput(raw: string): number | null {
  const cleaned = raw.replace(/[€\s]/g, '').replace(',', '.')
  if (cleaned === '' || !/^\d+(\.\d{1,2})?$/.test(cleaned)) return null
  return Math.round(Number(cleaned) * 100)
}

export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^+0-9]/g, '')}`
}

export function fullAddress(r: { street: string; postalCode: string; city: string }): string {
  return [r.street, [r.postalCode, r.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
}
