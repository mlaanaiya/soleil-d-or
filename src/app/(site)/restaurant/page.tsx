import type { Metadata } from 'next'
import { Marquee } from '@/components/restaurant/Marquee'
import { ScrollZoom } from '@/components/restaurant/ScrollZoom'
import styles from '@/components/restaurant/Restaurant.module.css'
import { PageHero } from '@/components/site/PageHero'
import { VisitBlock } from '@/components/site/VisitBlock'
import { Picture } from '@/components/ui/Picture'
import { getMenu, getProductsBySlugs } from '@/lib/server/catalog'
import { loadSite } from '@/lib/server/public'
import type { Media } from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const site = await loadSite()
  return {
    title: `${site.content.restaurantTitle} — ${site.restaurant.name}`,
    description: site.content.restaurantIntro.slice(0, 160),
    alternates: { canonical: '/restaurant' },
  }
}

const SWATCHES = [
  { name: 'Noir charbon', hex: '#0C0B09', token: 'charbon' },
  { name: 'Crème lumineux', hex: '#F5EDDC', token: 'creme' },
  { name: 'Jaune solaire', hex: '#FFC21A', token: 'soleil' },
]

/** Close-up framing (object-position) chosen per photograph to land on the most appetising detail. */
const CLOSE_UPS: Array<{ slug: string; focus: string; label: string }> = [
  { slug: 'double-cheeseburger', focus: '50% 62%', label: 'Le fondant' },
  { slug: 'crousty-riz-poulet', focus: '50% 40%', label: 'Le croustillant' },
  { slug: 'naans', focus: '35% 40%', label: 'Le grillé' },
]

export default async function RestaurantPage() {
  const site = await loadSite()
  const { content } = site
  const menu = getMenu()
  const photos = getProductsBySlugs(['assiette-grillee', 'naan-kebab', 'cordon-bleu', 'tacos-poulet', 'bowl-gourmand'])
    .map((p) => p.photo)
    .filter((m): m is Media => m !== null)
  const closeUps = CLOSE_UPS.map((c) => ({ ...c, media: getProductsBySlugs([c.slug])[0]?.photo ?? null })).filter(
    (c): c is (typeof CLOSE_UPS)[number] & { media: Media } => c.media !== null,
  )

  return (
    <>
      <PageHero
        eyebrow={site.restaurant.name}
        title={content.restaurantTitle}
        accent="à la lumière"
        intro={content.restaurantIntro}
      />

      <Marquee words={menu.map((c) => c.name)} />

      {content.chapters.map((chapter, i) => {
        const photo = photos.length > 0 ? photos[i % photos.length]! : null
        const second = photos.length > 1 ? photos[(i + 2) % photos.length]! : null
        return (
          <section key={i} className={`section ${styles.chapter}`} data-side={i % 2 === 0 ? 'left' : 'right'}>
            <div className={`container ${styles.chapterGrid}`}>
              <div className={styles.chapterText}>
                <span className={styles.chapterNum} aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2 className={styles.chapterTitle} data-reveal="up">
                  {chapter.title}
                </h2>
                <p className={styles.chapterBody} data-reveal="up" style={{ '--d': '0.1s' } as React.CSSProperties}>
                  {chapter.text}
                </p>
                {i === 0 && (
                  <ul className={styles.swatches} aria-label="Couleurs de l’identité">
                    {SWATCHES.map((s, si) => (
                      <li
                        key={s.token}
                        data-reveal="up"
                        style={{ '--d': `${0.15 + si * 0.08}s` } as React.CSSProperties}
                      >
                        <span className={styles.swatch} data-token={s.token} />
                        <span className={styles.swatchName}>{s.name}</span>
                        <span className={styles.swatchHex}>{s.hex}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className={styles.chapterMedia}>
                {photo && (
                  <figure className={styles.mainPhoto} data-reveal="mask">
                    <Picture media={photo} sizes="(max-width: 960px) 100vw, 50vw" />
                  </figure>
                )}
                {second && (
                  <figure
                    className={styles.sidePhoto}
                    data-reveal="sun"
                    style={{ '--d': '0.2s' } as React.CSSProperties}
                  >
                    <Picture media={second} sizes="(max-width: 960px) 50vw, 22vw" />
                  </figure>
                )}
              </div>
            </div>
          </section>
        )
      })}

      {closeUps.length > 0 && (
        <section className={`section ${styles.closeUps}`} aria-labelledby="closeups-title">
          <div className="container">
            <h2 id="closeups-title" className={styles.closeTitle}>
              De <span className="serif sun-text">très</span> près
            </h2>
            <div className={styles.closeGrid}>
              {closeUps.map((c) => (
                <ScrollZoom key={c.slug} media={c.media} focus={c.focus} label={c.label} />
              ))}
            </div>
          </div>
        </section>
      )}

      <VisitBlock site={site} />
    </>
  )
}
