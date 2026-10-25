'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { Picture } from '@/components/ui/Picture'
import { gsap } from '@/components/motion/gsap'
import type { Media } from '@/lib/types'
import styles from './GalleryTeaser.module.css'

export type GalleryShot = { media: Media; caption: string; href: string | null }

const SPEEDS = [-14, 10, -6, 16, -10, 8, -16]

/** Asymmetric editorial collage; every frame drifts at its own speed. */
export function GalleryTeaser({ title, intro, shots }: { title: string; intro: string; shots: GalleryShot[] }) {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.utils.toArray<HTMLElement>(`.${styles.shot}`, el).forEach((shot, i) => {
        gsap.fromTo(
          shot,
          { yPercent: SPEEDS[i % SPEEDS.length]! * -1 },
          {
            yPercent: SPEEDS[i % SPEEDS.length]!,
            ease: 'none',
            scrollTrigger: { trigger: shot, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        )
      })
      gsap.fromTo(
        `.${styles.bigWord}`,
        { xPercent: 8 },
        {
          xPercent: -18,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      )
    })
    return () => mm.revert()
  }, [])

  return (
    <section ref={root} className={`section ${styles.gallery}`} aria-labelledby="gallery-title">
      <div className={styles.bigWord} aria-hidden="true">
        {title}
      </div>
      <div className="container">
        <header className={styles.head}>
          <p className="eyebrow">
            <span className="sun-text">(05)</span> En images
          </p>
          <h2 id="gallery-title" className={styles.title}>
            {title}
          </h2>
          <p className={styles.intro}>{intro}</p>
        </header>
        <ul className={styles.grid}>
          {shots.slice(0, 7).map((s, i) => (
            <li key={s.media.id} className={`${styles.cell} ${styles[`c${i}`]}`}>
              <div className={styles.shot}>
                <figure data-reveal="mask" style={{ '--d': `${(i % 3) * 0.08}s` } as React.CSSProperties}>
                  {s.href ? (
                    <Link href={s.href} className={styles.frame}>
                      <Picture media={s.media} sizes="(max-width: 760px) 90vw, 40vw" className={styles.pic} />
                    </Link>
                  ) : (
                    <Picture media={s.media} sizes="(max-width: 760px) 90vw, 40vw" className={styles.pic} />
                  )}
                  <figcaption className={styles.caption}>{s.caption}</figcaption>
                </figure>
              </div>
            </li>
          ))}
        </ul>
        <div className={styles.more}>
          <Link href="/galerie" className="btn">
            Toute la galerie
            <span className="btn-dot" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
