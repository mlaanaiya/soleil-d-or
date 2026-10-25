import type { Metadata } from 'next'
import Link from 'next/link'
import { ProductForm } from '@/components/admin/ProductForm'
import { mediaLibraries } from '@/lib/server/admin-data'
import { listCategories } from '@/lib/server/catalog'

export const metadata: Metadata = { title: 'Nouveau produit' }

export default async function NewProduct(props: PageProps<'/admin/produits/nouveau'>) {
  const { categorie } = await props.searchParams
  const categories = listCategories()
  const { photos, cutouts } = mediaLibraries()
  const preset = Number(categorie)
  return (
    <>
      <header className="adm-page-head">
        <div>
          <Link href="/admin/produits" className="adm-sub">
            ← Produits & prix
          </Link>
          <h1 className="adm-title">Nouveau produit</h1>
        </div>
      </header>
      {categories.length === 0 ? (
        <p className="adm-alert">
          Créez d’abord une <Link href="/admin/categories">catégorie</Link>.
        </p>
      ) : (
        <ProductForm
          values={{
            id: null,
            name: '',
            slug: '',
            categoryId: categories.some((c) => c.id === preset) ? preset : categories[0]!.id,
            description: '',
            details: '',
            prices: [],
            photoMediaId: null,
            cutoutMediaId: null,
            available: true,
            visible: true,
            featured: false,
            badge: '',
          }}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          photos={photos}
          cutouts={cutouts}
        />
      )}
    </>
  )
}
