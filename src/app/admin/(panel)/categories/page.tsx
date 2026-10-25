import type { Metadata } from 'next'
import { CategoryEditor } from '@/components/admin/CategoryEditor'
import { mediaLibraries } from '@/lib/server/admin-data'
import { listCategories, listProducts } from '@/lib/server/catalog'

export const metadata: Metadata = { title: 'Catégories' }

export default async function CategoriesAdmin() {
  const categories = await listCategories()
  const products = await listProducts()
  const { photos } = await mediaLibraries()
  return (
    <>
      <header className="adm-page-head">
        <div>
          <h1 className="adm-title">Catégories</h1>
          <p className="adm-sub">
            L’ordre ci-dessous est celui de la carte. Une catégorie ne peut être supprimée que si elle est vide.
          </p>
        </div>
      </header>
      {categories.map((c, i) => (
        <CategoryEditor
          key={`${c.id}-${c.sort}-${c.name}-${c.cover?.id}`}
          first={i === 0}
          last={i === categories.length - 1}
          photos={photos}
          category={{
            id: c.id,
            name: c.name,
            slug: c.slug,
            tagline: c.tagline,
            description: c.description,
            coverMediaId: c.cover?.id ?? null,
            visible: c.visible,
            count: products.filter((p) => p.categoryId === c.id).length,
          }}
        />
      ))}
      <CategoryEditor
        photos={photos}
        category={{
          id: null,
          name: '',
          slug: '',
          tagline: '',
          description: '',
          coverMediaId: null,
          visible: true,
          count: 0,
        }}
      />
    </>
  )
}
