import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProductForm } from '@/components/admin/ProductForm'
import { centsToInput, mediaLibraries } from '@/lib/server/admin-data'
import { getProduct, listCategories } from '@/lib/server/catalog'

export const metadata: Metadata = { title: 'Modifier un produit' }

export default async function EditProduct(props: PageProps<'/admin/produits/[id]'>) {
  const { id } = await props.params
  const { cree } = await props.searchParams
  const product = await getProduct(Number(id))
  if (!product) notFound()
  const { photos, cutouts } = await mediaLibraries()
  return (
    <>
      <header className="adm-page-head">
        <div>
          <Link href="/admin/produits" className="adm-sub">
            ← Produits & prix
          </Link>
          <h1 className="adm-title">{product.name}</h1>
        </div>
      </header>
      {cree && (
        <p className="adm-success" style={{ marginBottom: 16 }}>
          Produit créé : il est déjà en ligne.
        </p>
      )}
      <ProductForm
        key={product.updatedAt}
        values={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          categoryId: product.categoryId,
          description: product.description,
          details: product.details,
          prices: product.prices.map((p) => ({ label: p.label, amount: centsToInput(p.cents) })),
          photoMediaId: product.photo?.id ?? null,
          cutoutMediaId: product.cutout?.id ?? null,
          available: product.available,
          visible: product.visible,
          featured: product.featured,
          badge: product.badge,
        }}
        categories={(await listCategories()).map((c) => ({ id: c.id, name: c.name }))}
        photos={photos}
        cutouts={cutouts}
      />
    </>
  )
}
