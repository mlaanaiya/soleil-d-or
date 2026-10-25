import 'server-only'
import { iso, one, query, transaction } from './db'
import { listGallery, toMedia, type MediaRow } from './media'
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
  cover: MediaRow | null
  sort: number
  visible: boolean
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
  prices: unknown
  photo: MediaRow | null
  cutout: MediaRow | null
  available: boolean
  visible: boolean
  featured: boolean
  badge: string
  sort: number
  updated_at: Date | string
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
    cover: row.cover ? toMedia(row.cover) : null,
    sort: row.sort,
    visible: row.visible,
  }
}

function toProduct(row: ProductRow): Product {
  const parsed = pricesSchema.safeParse(row.prices)
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
    photo: row.photo ? toMedia(row.photo) : null,
    cutout: row.cutout ? toMedia(row.cutout) : null,
    available: row.available,
    visible: row.visible,
    featured: row.featured,
    badge: row.badge,
    sort: row.sort,
    updatedAt: iso(row.updated_at),
  }
}

/** A media row embedded as JSON (one round trip for a whole list). */
const mediaJson = (column: string) =>
  `(SELECT row_to_json(m) FROM (SELECT ${MEDIA_JSON_COLUMNS} FROM media WHERE id = ${column}) m)`
const MEDIA_JSON_COLUMNS =
  'id, kind, original_name, alt, width, height, widths, has_alpha, placeholder, color, in_gallery, gallery_sort'

const CATEGORY_SELECT = `SELECT c.*, ${mediaJson('c.cover_media_id')} AS cover FROM categories c`

const PRODUCT_SELECT = `
  SELECT p.id, p.slug, p.category_id, p.name, p.description, p.details, p.prices, p.available, p.visible,
         p.featured, p.badge, p.sort, p.updated_at, c.slug AS category_slug, c.name AS category_name,
         ${mediaJson('p.photo_media_id')} AS photo, ${mediaJson('p.cutout_media_id')} AS cutout
  FROM products p JOIN categories c ON c.id = p.category_id`

/* ------------------------------ Reads ------------------------------ */

export async function listCategories(opts: { publicOnly?: boolean } = {}): Promise<Category[]> {
  const rows = await query<CategoryRow>(
    `${CATEGORY_SELECT} ${opts.publicOnly ? 'WHERE c.visible' : ''} ORDER BY c.sort, c.id`,
  )
  return rows.map(toCategory)
}

export async function getCategory(id: number): Promise<Category | null> {
  const row = await one<CategoryRow>(`${CATEGORY_SELECT} WHERE c.id = $1`, [id])
  return row ? toCategory(row) : null
}

export async function listProducts(opts: { publicOnly?: boolean; categoryId?: number } = {}): Promise<Product[]> {
  const where: string[] = []
  const params: unknown[] = []
  if (opts.publicOnly) where.push('p.visible AND c.visible')
  if (opts.categoryId) {
    params.push(opts.categoryId)
    where.push(`p.category_id = $${params.length}`)
  }
  const rows = await query<ProductRow>(
    `${PRODUCT_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY c.sort, p.sort, p.id`,
    params,
  )
  return rows.map(toProduct)
}

export async function getProduct(id: number): Promise<Product | null> {
  const row = await one<ProductRow>(`${PRODUCT_SELECT} WHERE p.id = $1`, [id])
  return row ? toProduct(row) : null
}

export async function getPublicProductBySlug(slug: string): Promise<Product | null> {
  const row = await one<ProductRow>(`${PRODUCT_SELECT} WHERE p.slug = $1 AND p.visible AND c.visible`, [slug])
  return row ? toProduct(row) : null
}

/** The public menu: visible categories, each with its visible products. */
export async function getMenu(): Promise<CategoryWithProducts[]> {
  const [products, categories] = await Promise.all([
    listProducts({ publicOnly: true }),
    listCategories({ publicOnly: true }),
  ])
  return categories.map((c) => ({ ...c, products: products.filter((p) => p.categoryId === c.id) }))
}

export async function getFeatured(limit = 8): Promise<Product[]> {
  return (await listProducts({ publicOnly: true })).filter((p) => p.featured).slice(0, limit)
}

export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
  const all = await listProducts({ publicOnly: true })
  return slugs.map((s) => all.find((p) => p.slug === s)).filter((p): p is Product => Boolean(p))
}

/** Same category first, then other featured products — never the product itself. */
export async function getSuggestions(product: Product, limit = 3): Promise<Product[]> {
  const all = (await listProducts({ publicOnly: true })).filter((p) => p.id !== product.id && p.photo)
  const same = all.filter((p) => p.categoryId === product.categoryId)
  const others = all.filter((p) => p.categoryId !== product.categoryId && p.featured)
  const rest = all.filter((p) => !same.includes(p) && !others.includes(p))
  return [...same, ...others, ...rest].slice(0, limit)
}

/* ------------------------------ Writes ----------------------------- */

async function assertUniqueSlug(table: 'products' | 'categories', slug: string, exceptId?: number) {
  const row = await one(`SELECT id FROM ${table} WHERE slug = $1 AND id <> $2`, [slug, exceptId ?? -1])
  if (row) throw new CatalogError('Cette adresse (slug) est déjà utilisée.')
}

async function assertCategory(id: number) {
  if (!(await one('SELECT 1 FROM categories WHERE id = $1', [id]))) throw new CatalogError('Catégorie introuvable.')
}

function productParams(input: ProductInput): unknown[] {
  return [
    input.slug,
    input.categoryId,
    input.name,
    input.description,
    input.details,
    JSON.stringify(input.prices),
    input.photoMediaId,
    input.cutoutMediaId,
    input.available,
    input.visible,
    input.featured,
    input.badge,
  ]
}

export async function createProduct(input: ProductInput): Promise<number> {
  await assertUniqueSlug('products', input.slug)
  await assertCategory(input.categoryId)
  const row = await one<{ id: number }>(
    `INSERT INTO products (slug, category_id, name, description, details, prices, photo_media_id, cutout_media_id,
                           available, visible, featured, badge, sort)
     VALUES ($1, $2, $3, $4, $5, $6::text::jsonb, $7, $8, $9, $10, $11, $12,
             (SELECT COALESCE(MAX(sort), 0) + 1 FROM products WHERE category_id = $2))
     RETURNING id`,
    productParams(input),
  )
  return row!.id
}

export async function updateProduct(id: number, input: ProductInput) {
  await assertUniqueSlug('products', input.slug, id)
  await assertCategory(input.categoryId)
  const rows = await query(
    `UPDATE products SET slug = $1, category_id = $2, name = $3, description = $4, details = $5, prices = $6::text::jsonb,
       photo_media_id = $7, cutout_media_id = $8, available = $9, visible = $10, featured = $11, badge = $12,
       updated_at = now()
     WHERE id = $13 RETURNING id`,
    [...productParams(input), id],
  )
  if (rows.length === 0) throw new CatalogError('Produit introuvable.')
}

export async function setProductFlag(id: number, flag: 'available' | 'visible' | 'featured', value: boolean) {
  const column = { available: 'available', visible: 'visible', featured: 'featured' }[flag]
  await query(`UPDATE products SET ${column} = $1, updated_at = now() WHERE id = $2`, [value, id])
}

export async function deleteProduct(id: number) {
  await query('DELETE FROM products WHERE id = $1', [id])
}

export async function createCategory(input: CategoryInput): Promise<number> {
  await assertUniqueSlug('categories', input.slug)
  const row = await one<{ id: number }>(
    `INSERT INTO categories (slug, name, tagline, description, cover_media_id, visible, sort)
     VALUES ($1, $2, $3, $4, $5, $6, (SELECT COALESCE(MAX(sort), 0) + 1 FROM categories))
     RETURNING id`,
    [input.slug, input.name, input.tagline, input.description, input.coverMediaId, input.visible],
  )
  return row!.id
}

export async function updateCategory(id: number, input: CategoryInput) {
  await assertUniqueSlug('categories', input.slug, id)
  const rows = await query(
    `UPDATE categories SET slug = $1, name = $2, tagline = $3, description = $4, cover_media_id = $5, visible = $6
     WHERE id = $7 RETURNING id`,
    [input.slug, input.name, input.tagline, input.description, input.coverMediaId, input.visible, id],
  )
  if (rows.length === 0) throw new CatalogError('Catégorie introuvable.')
}

export async function deleteCategory(id: number) {
  const row = await one<{ n: number }>('SELECT COUNT(*)::int AS n FROM products WHERE category_id = $1', [id])
  if (row && row.n > 0) throw new CatalogError('Déplacez ou supprimez d’abord les produits de cette catégorie.')
  await query('DELETE FROM categories WHERE id = $1', [id])
}

/** Moves a row one step up or down inside its ordered list. */
export async function move(table: 'products' | 'categories', id: number, direction: -1 | 1) {
  await transaction(async (tx) => {
    let ids: Array<{ id: number }>
    if (table === 'products') {
      const scope = (await tx.query<{ category_id: number }>('SELECT category_id FROM products WHERE id = $1', [id]))[0]
      if (!scope) return
      ids = await tx.query('SELECT id FROM products WHERE category_id = $1 ORDER BY sort, id', [scope.category_id])
    } else {
      ids = await tx.query('SELECT id FROM categories ORDER BY sort, id')
    }
    const order = ids.map((r) => r.id)
    const index = order.indexOf(id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= order.length) return
    ;[order[index], order[target]] = [order[target]!, order[index]!]
    for (const [i, rowId] of order.entries()) {
      await tx.query(`UPDATE ${table} SET sort = $1 WHERE id = $2`, [i + 1, rowId])
    }
  })
}

/** Gallery photographs, each linked to the public product it illustrates (if any). */
export async function getGalleryShots(): Promise<
  Array<{
    media: Media
    caption: string
    href: string | null
    categorySlug: string | null
    categoryName: string | null
  }>
> {
  const [products, gallery] = await Promise.all([listProducts({ publicOnly: true }), listGallery()])
  return gallery.map((media) => {
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
export async function getAdjacent(product: Product): Promise<{ prev: Product | null; next: Product | null }> {
  const all = await listProducts({ publicOnly: true })
  const i = all.findIndex((p) => p.id === product.id)
  if (i < 0 || all.length < 2) return { prev: null, next: null }
  return { prev: all[(i - 1 + all.length) % all.length]!, next: all[(i + 1) % all.length]! }
}
