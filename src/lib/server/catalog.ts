import 'server-only'
import { db } from './db'
import { getMedia, listGallery } from './media'
import { priceSchema, type CategoryInput, type ProductInput } from '../schemas'
import type { Category, CategoryWithProducts, Media, Product } from '../types'
import { z } from 'zod'

type CategoryRow = {
  id: number
  slug: string
  name: string
  tagline: string
  description: string
  cover_media_id: string | null
  sort: number
  visible: number
}

type ProductRow = {
  id: number
  slug: string
  category_id: number
  category_slug: string
  category_name: string
  name: string
  description: string
  details: string
  prices: string
  photo_media_id: string | null
  cutout_media_id: string | null
  available: number
  visible: number
  featured: number
  badge: string
  sort: number
  updated_at: string
}

export class CatalogError extends Error {}

const pricesSchema = z.array(priceSchema)

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    cover: getMedia(row.cover_media_id),
    sort: row.sort,
    visible: row.visible === 1,
  }
}

function toProduct(row: ProductRow): Product {
  const parsed = pricesSchema.safeParse(JSON.parse(row.prices))
  return {
    id: row.id,
    slug: row.slug,
    categoryId: row.category_id,
    categorySlug: row.category_slug,
    categoryName: row.category_name,
    name: row.name,
    description: row.description,
    details: row.details,
    prices: parsed.success ? parsed.data : [],
    photo: getMedia(row.photo_media_id),
    cutout: getMedia(row.cutout_media_id),
    available: row.available === 1,
    visible: row.visible === 1,
    featured: row.featured === 1,
    badge: row.badge,
    sort: row.sort,
    updatedAt: row.updated_at,
  }
}

const PRODUCT_SELECT = `
  SELECT p.*, c.slug AS category_slug, c.name AS category_name
  FROM products p JOIN categories c ON c.id = p.category_id`

/* ------------------------------ Reads ------------------------------ */

export function listCategories(opts: { publicOnly?: boolean } = {}): Category[] {
  const rows = db()
    .prepare(`SELECT * FROM categories ${opts.publicOnly ? 'WHERE visible = 1' : ''} ORDER BY sort, id`)
    .all() as CategoryRow[]
  return rows.map(toCategory)
}

export function getCategory(id: number): Category | null {
  const row = db().prepare('SELECT * FROM categories WHERE id = ?').get(id) as CategoryRow | undefined
  return row ? toCategory(row) : null
}

export function listProducts(opts: { publicOnly?: boolean; categoryId?: number } = {}): Product[] {
  const where: string[] = []
  const params: unknown[] = []
  if (opts.publicOnly) where.push('p.visible = 1 AND c.visible = 1')
  if (opts.categoryId) {
    where.push('p.category_id = ?')
    params.push(opts.categoryId)
  }
  const rows = db()
    .prepare(`${PRODUCT_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY c.sort, p.sort, p.id`)
    .all(...params) as ProductRow[]
  return rows.map(toProduct)
}

export function getProduct(id: number): Product | null {
  const row = db().prepare(`${PRODUCT_SELECT} WHERE p.id = ?`).get(id) as ProductRow | undefined
  return row ? toProduct(row) : null
}

export function getPublicProductBySlug(slug: string): Product | null {
  const row = db()
    .prepare(`${PRODUCT_SELECT} WHERE p.slug = ? AND p.visible = 1 AND c.visible = 1`)
    .get(slug) as ProductRow | undefined
  return row ? toProduct(row) : null
}

/** The public menu: visible categories, each with its visible products. */
export function getMenu(): CategoryWithProducts[] {
  const products = listProducts({ publicOnly: true })
  return listCategories({ publicOnly: true }).map((c) => ({
    ...c,
    products: products.filter((p) => p.categoryId === c.id),
  }))
}

export function getFeatured(limit = 8): Product[] {
  return listProducts({ publicOnly: true })
    .filter((p) => p.featured)
    .slice(0, limit)
}

export function getProductsBySlugs(slugs: string[]): Product[] {
  const all = listProducts({ publicOnly: true })
  return slugs.map((s) => all.find((p) => p.slug === s)).filter((p): p is Product => Boolean(p))
}

/** Same category first, then other featured products — never the product itself. */
export function getSuggestions(product: Product, limit = 3): Product[] {
  const all = listProducts({ publicOnly: true }).filter((p) => p.id !== product.id && p.photo)
  const same = all.filter((p) => p.categoryId === product.categoryId)
  const others = all.filter((p) => p.categoryId !== product.categoryId && p.featured)
  const rest = all.filter((p) => !same.includes(p) && !others.includes(p))
  return [...same, ...others, ...rest].slice(0, limit)
}

/* ------------------------------ Writes ----------------------------- */

function assertUniqueSlug(table: 'products' | 'categories', slug: string, exceptId?: number) {
  const row = db()
    .prepare(`SELECT id FROM ${table} WHERE slug = ? AND id != ?`)
    .get(slug, exceptId ?? -1) as { id: number } | undefined
  if (row) throw new CatalogError('Cette adresse (slug) est déjà utilisée.')
}

function assertCategory(id: number) {
  if (!getCategory(id)) throw new CatalogError('Catégorie introuvable.')
}

function productParams(input: ProductInput) {
  return {
    slug: input.slug,
    category_id: input.categoryId,
    name: input.name,
    description: input.description,
    details: input.details,
    prices: JSON.stringify(input.prices),
    photo_media_id: input.photoMediaId,
    cutout_media_id: input.cutoutMediaId,
    available: input.available ? 1 : 0,
    visible: input.visible ? 1 : 0,
    featured: input.featured ? 1 : 0,
    badge: input.badge,
  }
}

export function createProduct(input: ProductInput): number {
  assertUniqueSlug('products', input.slug)
  assertCategory(input.categoryId)
  const result = db()
    .prepare(
      `INSERT INTO products (slug, category_id, name, description, details, prices, photo_media_id, cutout_media_id,
                             available, visible, featured, badge, sort)
       VALUES (@slug, @category_id, @name, @description, @details, @prices, @photo_media_id, @cutout_media_id,
               @available, @visible, @featured, @badge,
               (SELECT COALESCE(MAX(sort), 0) + 1 FROM products WHERE category_id = @category_id))`,
    )
    .run(productParams(input))
  return Number(result.lastInsertRowid)
}

export function updateProduct(id: number, input: ProductInput) {
  assertUniqueSlug('products', input.slug, id)
  assertCategory(input.categoryId)
  const result = db()
    .prepare(
      `UPDATE products SET slug = @slug, category_id = @category_id, name = @name, description = @description,
         details = @details, prices = @prices, photo_media_id = @photo_media_id, cutout_media_id = @cutout_media_id,
         available = @available, visible = @visible, featured = @featured, badge = @badge, updated_at = datetime('now')
       WHERE id = @id`,
    )
    .run({ ...productParams(input), id })
  if (result.changes === 0) throw new CatalogError('Produit introuvable.')
}

export function setProductFlag(id: number, flag: 'available' | 'visible' | 'featured', value: boolean) {
  const column = { available: 'available', visible: 'visible', featured: 'featured' }[flag]
  db()
    .prepare(`UPDATE products SET ${column} = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(value ? 1 : 0, id)
}

export function deleteProduct(id: number) {
  db().prepare('DELETE FROM products WHERE id = ?').run(id)
}

export function createCategory(input: CategoryInput): number {
  assertUniqueSlug('categories', input.slug)
  const result = db()
    .prepare(
      `INSERT INTO categories (slug, name, tagline, description, cover_media_id, visible, sort)
       VALUES (?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort), 0) + 1 FROM categories))`,
    )
    .run(input.slug, input.name, input.tagline, input.description, input.coverMediaId, input.visible ? 1 : 0)
  return Number(result.lastInsertRowid)
}

export function updateCategory(id: number, input: CategoryInput) {
  assertUniqueSlug('categories', input.slug, id)
  const result = db()
    .prepare(
      'UPDATE categories SET slug = ?, name = ?, tagline = ?, description = ?, cover_media_id = ?, visible = ? WHERE id = ?',
    )
    .run(input.slug, input.name, input.tagline, input.description, input.coverMediaId, input.visible ? 1 : 0, id)
  if (result.changes === 0) throw new CatalogError('Catégorie introuvable.')
}

export function deleteCategory(id: number) {
  const { n } = db().prepare('SELECT COUNT(*) AS n FROM products WHERE category_id = ?').get(id) as { n: number }
  if (n > 0) throw new CatalogError('Déplacez ou supprimez d’abord les produits de cette catégorie.')
  db().prepare('DELETE FROM categories WHERE id = ?').run(id)
}

/** Moves a row one step up or down inside its ordered list. */
export function move(table: 'products' | 'categories', id: number, direction: -1 | 1) {
  const scope =
    table === 'products'
      ? (db().prepare('SELECT category_id FROM products WHERE id = ?').get(id) as { category_id: number } | undefined)
      : { category_id: null }
  if (!scope) return
  const ids = (
    table === 'products'
      ? db().prepare('SELECT id FROM products WHERE category_id = ? ORDER BY sort, id').all(scope.category_id)
      : db().prepare('SELECT id FROM categories ORDER BY sort, id').all()
  ) as Array<{ id: number }>
  const order = ids.map((r) => r.id)
  const index = order.indexOf(id)
  const target = index + direction
  if (index < 0 || target < 0 || target >= order.length) return
  ;[order[index], order[target]] = [order[target]!, order[index]!]
  const update = db().prepare(`UPDATE ${table} SET sort = ? WHERE id = ?`)
  db().transaction(() => order.forEach((rowId, i) => update.run(i + 1, rowId)))()
}

/** Gallery photographs, each linked to the public product it illustrates (if any). */
export function getGalleryShots(): Array<{ media: Media; caption: string; href: string | null; categorySlug: string | null; categoryName: string | null }> {
  const products = listProducts({ publicOnly: true })
  return listGallery().map((media) => {
    const product = products.find((p) => p.photo?.id === media.id)
    return {
      media,
      caption: product?.name ?? media.alt,
      href: product ? `/carte/${product.slug}` : null,
      categorySlug: product?.categorySlug ?? null,
      categoryName: product?.categoryName ?? null,
    }
  })
}

/** Previous and next public products, following the menu order (wrapping around). */
export function getAdjacent(product: Product): { prev: Product | null; next: Product | null } {
  const all = listProducts({ publicOnly: true })
  const i = all.findIndex((p) => p.id === product.id)
  if (i < 0 || all.length < 2) return { prev: null, next: null }
  return { prev: all[(i - 1 + all.length) % all.length]!, next: all[(i + 1) % all.length]! }
}
