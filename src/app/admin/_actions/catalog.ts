'use server'

import { redirect } from 'next/navigation'
import { bool, int, nullableId, runAdmin, str, type ActionState } from '@/lib/server/admin-action'
import {
  CatalogError,
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getProduct,
  move,
  setProductFlag,
  updateCategory,
  updateProduct,
} from '@/lib/server/catalog'
import { parsePriceInput, slugify } from '@/lib/format'
import { categoryInputSchema, productInputSchema, type Price } from '@/lib/schemas'

/** Reads the repeatable price rows (label[] / amount[]); empty rows are ignored. */
function readPrices(form: FormData): Price[] {
  const labels = form.getAll('priceLabel').map(String)
  const amounts = form.getAll('priceAmount').map(String)
  const prices: Price[] = []
  amounts.forEach((raw, i) => {
    if (raw.trim() === '') return
    const cents = parsePriceInput(raw)
    if (cents === null) throw new CatalogError(`Prix invalide : « ${raw} ». Exemple attendu : 8,50`)
    prices.push({ label: (labels[i] ?? '').trim(), cents })
  })
  return prices
}

export async function saveProduct(_: ActionState, form: FormData): Promise<ActionState> {
  const id = int(form, 'id')
  let createdId = 0
  const result = await runAdmin(
    () => {
      const name = str(form, 'name')
      const input = productInputSchema.parse({
        name,
        slug: str(form, 'slug') || slugify(name),
        categoryId: int(form, 'categoryId'),
        description: str(form, 'description'),
        details: str(form, 'details'),
        prices: readPrices(form),
        photoMediaId: nullableId(form, 'photoMediaId'),
        cutoutMediaId: nullableId(form, 'cutoutMediaId'),
        available: bool(form, 'available'),
        visible: bool(form, 'visible'),
        featured: bool(form, 'featured'),
        badge: str(form, 'badge'),
      })
      if (id) updateProduct(id, input)
      else createdId = createProduct(input)
    },
    id ? 'Produit enregistré. Le site est à jour.' : 'Produit créé.',
  )
  if (result.ok && createdId) redirect(`/admin/produits/${createdId}?cree=1`)
  return result
}

export async function quickPrices(id: number, rows: Array<{ label: string; amount: string }>): Promise<ActionState> {
  return runAdmin(() => {
    const product = getProduct(id)
    if (!product) throw new CatalogError('Produit introuvable.')
    const form = new FormData()
    rows.forEach((r) => {
      form.append('priceLabel', r.label)
      form.append('priceAmount', r.amount)
    })
    updateProduct(id, {
      name: product.name,
      slug: product.slug,
      categoryId: product.categoryId,
      description: product.description,
      details: product.details,
      prices: readPrices(form),
      photoMediaId: product.photo?.id ?? null,
      cutoutMediaId: product.cutout?.id ?? null,
      available: product.available,
      visible: product.visible,
      featured: product.featured,
      badge: product.badge,
    })
  }, 'Prix enregistrés.')
}

export async function toggleProduct(
  id: number,
  flag: 'available' | 'visible' | 'featured',
  value: boolean,
): Promise<ActionState> {
  return runAdmin(() => setProductFlag(id, flag, value), 'Modification enregistrée.')
}

export async function removeProduct(id: number): Promise<ActionState> {
  const result = await runAdmin(() => deleteProduct(id), 'Produit supprimé.')
  if (result.ok) redirect('/admin/produits?supprime=1')
  return result
}

export async function moveProduct(id: number, direction: -1 | 1): Promise<ActionState> {
  return runAdmin(() => move('products', id, direction), 'Ordre mis à jour.')
}

export async function saveCategory(_: ActionState, form: FormData): Promise<ActionState> {
  const id = int(form, 'id')
  return runAdmin(
    () => {
      const name = str(form, 'name')
      const input = categoryInputSchema.parse({
        name,
        slug: str(form, 'slug') || slugify(name),
        tagline: str(form, 'tagline'),
        description: str(form, 'description'),
        coverMediaId: nullableId(form, 'coverMediaId'),
        visible: bool(form, 'visible'),
      })
      if (id) updateCategory(id, input)
      else createCategory(input)
    },
    id ? 'Catégorie enregistrée.' : 'Catégorie créée.',
  )
}

export async function removeCategory(id: number): Promise<ActionState> {
  return runAdmin(() => deleteCategory(id), 'Catégorie supprimée.')
}

export async function moveCategory(id: number, direction: -1 | 1): Promise<ActionState> {
  return runAdmin(() => move('categories', id, direction), 'Ordre mis à jour.')
}
