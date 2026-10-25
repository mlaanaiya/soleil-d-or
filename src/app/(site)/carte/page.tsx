import type { Metadata } from 'next'
import { MenuBoard } from '@/components/menu/MenuBoard'
import { JsonLd } from '@/components/seo/JsonLd'
import { PageHero } from '@/components/site/PageHero'
import { getMenu } from '@/lib/server/catalog'
import { loadSite } from '@/lib/server/public'
import { menuJsonLd } from '@/lib/server/structured'
import { summarize } from '@/lib/summary'

export async function generateMetadata(): Promise<Metadata> {
  const site = await loadSite()
  const name = site.restaurant.name
  return {
    title: `La carte — ${name}`,
    description: `Toute la carte de ${name} : sandwichs, assiettes, tacos, burgers, crousty riz, bowls, accompagnements et boissons.`,
    alternates: { canonical: '/carte' },
  }
}

export default async function CartePage() {
  await loadSite()
  const menu = getMenu()
  const count = menu.reduce((n, c) => n + c.products.length, 0)

  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', ...menuJsonLd(menu) }} />
      <PageHero
        eyebrow="La carte"
        title="La carte"
        accent="en pleine lumière"
        intro={`${count} recettes réparties en ${menu.length} familles. Touchez un produit pour le découvrir en grand.`}
      />
      <MenuBoard
        categories={menu.map((c) => ({
          slug: c.slug,
          name: c.name,
          tagline: c.tagline,
          description: c.description,
          products: c.products.map(summarize),
        }))}
      />
    </>
  )
}
