'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { ProductTile } from '@/components/product/ProductTile'
import { gsap } from '@/components/motion/gsap'
import type { ProductSummary } from '@/lib/summary'
import styles from './FeaturedRail.module.css'

/**
 * Desktop: the section is pinned and vertical scroll drives the track horizontally.
 * Touch/narrow screens: a native, snap-aligned horizontal carousel.
 */
export function FeaturedRail({ title, intro, products }: { title: string; intro: string; products: ProductSummary[] }) {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const mm = gsap.matchMedia()
    mm.add('(min-width: 961px) and (hover: hover) and (prefers-reduced-motion: no-preference)', () => {
      const track = el.querySelector<HTMLElement>(`.${styles.track}`)!
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 64)
      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: (self) => el.style.setProperty('--progress', self.progress.toFixed(3)),
        },
      })
    })
    return () => mm.revert()
  }, [])

  return (
    <section ref={root} className={styles.rail} aria-labelledby="featured-title">
      <div className={styles.track}>
        <header className={styles.head}>
          <p className="eyebrow">
            <span className="sun-text">(02)</span> La sélection
          </p>
          <h2 id="featured-title" className={styles.title}>
            {title}
          </h2>
          <p className={styles.intro}>{intro}</p>
          <Link href="/carte" className="btn btn--ghost">
            Toute la carte
          </Link>
          <div className={styles.progress} aria-hidden="true">
            <span />
          </div>
        </header>
        <ul className={styles.list}>
          {products.map((p, i) => (
            <li key={p.slug} className={styles.item}>
              <ProductTile product={p} index={i} sizes="(max-width: 760px) 78vw, 26vw" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
