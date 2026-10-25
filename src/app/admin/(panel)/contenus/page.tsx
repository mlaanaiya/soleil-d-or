import type { Metadata } from 'next'
import { ContentForm } from '@/components/admin/ContentForm'
import { listProducts } from '@/lib/server/catalog'
import { getSetting } from '@/lib/server/settings'

export const metadata: Metadata = { title: 'Textes du site' }

export default async function ContentAdmin() {
  const products = listProducts().map((p) => ({ slug: p.slug, name: p.name, hasCutout: Boolean(p.cutout), hasPhoto: Boolean(p.photo) }))
  return (
    <>
      <header className="adm-page-head">
        <div>
          <h1 className="adm-title">Textes du site</h1>
          <p className="adm-sub">Titres et textes éditoriaux. Restez factuel : n’indiquez que des informations vérifiées.</p>
        </div>
      </header>
      <ContentForm initial={getSetting('content')} products={products} />
    </>
  )
}
