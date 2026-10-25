import type { Metadata } from 'next'
import Link from 'next/link'
import { ProductRows, type AdminCategoryGroup } from '@/components/admin/ProductRows'
import { mediaUrl } from '@/components/ui/Picture'
import { centsToInput as amount } from '@/lib/server/admin-data'
import { listCategories, listProducts } from '@/lib/server/catalog'

export const metadata: Metadata = { title: 'Produits & prix' }

export default async function ProductsAdmin(props: PageProps<'/admin/produits'>) {
  const { sansprix, supprime } = await props.searchParams
  const products = await listProducts()
  const groups: AdminCategoryGroup[] = (await listCategories()).map((c) => ({
    id: c.id,
    name: c.name,
    visible: c.visible,
    products: products
      .filter((p) => p.categoryId === c.id)
      .map((p) => {
        const thumbMedia = p.photo ?? p.cutout
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          categoryId: p.categoryId,
          thumb: thumbMedia ? mediaUrl(thumbMedia, 200) : null,
          prices: p.prices.map((x) => ({ label: x.label, amount: amount(x.cents) })),
          available: p.available,
          featured: p.featured,
          visible: p.visible,
          badge: p.badge,
        }
      }),
  }))

  return (
    <>
      <header className="adm-page-head">
        <div>
          <h1 className="adm-title">Produits & prix</h1>
          <p className="adm-sub">
            Modifiez un prix directement dans la liste puis cliquez sur « Enregistrer le prix ». Pour les photos, la
            description ou la catégorie, ouvrez la fiche du produit.
          </p>
        </div>
        <Link href="/admin/produits/nouveau" className="adm-btn adm-btn--primary">
          + Nouveau produit
        </Link>
      </header>
      {supprime && (
        <p className="adm-success" style={{ marginBottom: 16 }}>
          Produit supprimé.
        </p>
      )}
      <ProductRows groups={groups} onlyMissing={sansprix === '1'} />
    </>
  )
}
