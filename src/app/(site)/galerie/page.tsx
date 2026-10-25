import type { Metadata } from 'next'
import { GalleryWall } from '@/components/gallery/GalleryWall'
import { PageHero } from '@/components/site/PageHero'
import { getGalleryShots } from '@/lib/server/catalog'
import { loadSite } from '@/lib/server/public'

export async function generateMetadata(): Promise<Metadata> {
  const site = await loadSite()
  return {
    title: `${site.content.galleryTitle} — ${site.restaurant.name}`,
    description: site.content.galleryIntro,
    alternates: { canonical: '/galerie' },
  }
}

export default async function GaleriePage() {
  const site = await loadSite()
  const shots = getGalleryShots()
  return (
    <>
      <PageHero eyebrow="Photographies" title={site.content.galleryTitle} accent="en pleine lumière" intro={site.content.galleryIntro} />
      <div className="container">
        {shots.length > 0 ? (
          <GalleryWall shots={shots} />
        ) : (
          <p className="lead" style={{ paddingBlock: 'var(--section)' }}>
            Les photographies seront bientôt publiées.
          </p>
        )}
      </div>
    </>
  )
}
