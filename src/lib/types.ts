import type { Price } from './schemas'

export type Media = {
  id: string
  kind: 'photo' | 'cutout'
  alt: string
  width: number
  height: number
  widths: number[]
  hasAlpha: boolean
  placeholder: string
  color: string
  inGallery: boolean
  gallerySort: number
  originalName: string
}

export type Category = {
  id: number
  slug: string
  name: string
  tagline: string
  description: string
  cover: Media | null
  sort: number
  visible: boolean
}

export type Product = {
  id: number
  slug: string
  categoryId: number
  categorySlug: string
  categoryName: string
  name: string
  description: string
  details: string
  prices: Price[]
  photo: Media | null
  cutout: Media | null
  available: boolean
  visible: boolean
  featured: boolean
  badge: string
  sort: number
  updatedAt: string
}

export type CategoryWithProducts = Category & { products: Product[] }

export type OrderItem = { productId: number; name: string; label: string; cents: number; quantity: number }
