import { formatPrice, fromPrice } from './format'
import type { Media, Product } from './types'

/** Serializable product view model for client components. */
export type ProductSummary = {
  id: number
  slug: string
  name: string
  category: string
  categorySlug: string
  description: string
  price: string | null
  prices: Array<{ label: string; price: string }>
  available: boolean
  badge: string
  photo: Media | null
  cutout: Media | null
}

export function priceLabel(p: Pick<Product, 'prices'>): string | null {
  const from = fromPrice(p.prices)
  if (from === null) return null
  return `${p.prices.length > 1 ? 'dès ' : ''}${formatPrice(from)}`
}

export function summarize(p: Product): ProductSummary {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.categoryName,
    categorySlug: p.categorySlug,
    description: p.description,
    price: priceLabel(p),
    prices: p.prices.map((x) => ({ label: x.label, price: formatPrice(x.cents) })),
    available: p.available,
    badge: p.badge,
    photo: p.photo,
    cutout: p.cutout,
  }
}
