import { CategoryIndex } from '@/components/home/CategoryIndex'
import { FeaturedRail } from '@/components/home/FeaturedRail'
import { FinalCta } from '@/components/home/FinalCta'
import { GalleryTeaser } from '@/components/home/GalleryTeaser'
import { Hero, type HeroProduct } from '@/components/home/Hero'
import { Manifesto } from '@/components/home/Manifesto'
import { Spotlight } from '@/components/home/Spotlight'
import { VisitBlock } from '@/components/site/VisitBlock'
import { getFeatured, getGalleryShots, getMenu, getProductsBySlugs } from '@/lib/server/catalog'
import { loadSite } from '@/lib/server/public'
import { priceLabel, summarize } from '@/lib/summary'
import type { Product } from '@/lib/types'

function toHero(p: Product): HeroProduct | null {
  if (!p.cutout) return null
  return { slug: p.slug, name: p.name, category: p.categoryName, price: priceLabel(p), cutout: p.cutout }
}

export default async function HomePage() {
  const site = await loadSite()
  const { content } = site
  const featured = getFeatured(10)

  let heroProducts = getProductsBySlugs(content.heroProducts).map(toHero).filter((p): p is HeroProduct => p !== null)
  if (heroProducts.length === 0) heroProducts = featured.map(toHero).filter((p): p is HeroProduct => p !== null).slice(0, 3)

  const menu = getMenu()
  const spotlight = getProductsBySlugs(content.spotlightProducts)
  const shots = getGalleryShots()
  const stampPhoto = getProductsBySlugs(['naans'])[0]?.photo ?? shots[0]?.media ?? null
  const orderCta = site.canOrder ? { href: '/commander', label: 'Commander' } : { href: '/contact', label: 'Nous trouver' }

  return (
    <>
      <Hero
        name={site.restaurant.name}
        kicker={content.heroKicker}
        tagline={content.heroTagline}
        products={heroProducts}
        cta={{ href: '/carte', label: 'Découvrir la carte' }}
        secondary={orderCta}
      />
      <Manifesto text={content.manifesto} name={site.restaurant.name} photo={stampPhoto} />
      {featured.length > 0 && (
        <FeaturedRail title={content.featuredTitle} intro={content.featuredIntro} products={featured.map(summarize)} />
      )}
      <CategoryIndex
        title={content.categoriesTitle}
        categories={menu.map((c) => ({
          slug: c.slug,
          name: c.name,
          tagline: c.tagline,
          count: c.products.length,
          cover: c.cover,
        }))}
      />
      {spotlight.length > 0 && (
        <Spotlight title={content.spotlightTitle} text={content.spotlightText} products={spotlight.map(summarize)} />
      )}
      {shots.length > 0 && <GalleryTeaser title={content.galleryTitle} intro={content.galleryIntro} shots={shots} />}
      <VisitBlock site={site} index="(06)" />
      <FinalCta title={content.ctaTitle} primary={{ href: '/carte', label: 'Voir la carte' }} secondary={orderCta} />
    </>
  )
}
