'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { SunlitPicture } from '@/components/ui/SunlitPicture'
import { gsap } from '@/components/motion/gsap'
import type { ProductSummary } from '@/lib/summary'
import styles from './Spotlight.module.css'

/**
 * A photograph opens from a small sun to full bleed while the section is pinned,
 * then the next product wipes in along the horizon.
 */
export function Spotlight({ title, text, products }: { title: string; text: string; products: ProductSummary[] }) {
  const root = useRef<HTMLElement>(null)
  const shots = products.filter((p) => p.photo)

  useEffect(() => {
    const el = root.current
    if (!el || shots.length === 0) return
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const frames = gsap.utils.toArray<HTMLElement>(`.${styles.frame}`, el)
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: () => `+=${window.innerHeight * (1.2 + frames.length * 0.8)}`,
          pin: true,
          scrub: 0.7,
          invalidateOnRefresh: true,
        },
      })
      tl.fromTo(frames[0]!, { clipPath: 'circle(14% at 50% 62%)' }, { clipPath: 'circle(75% at 50% 50%)', duration: 1 })
        .fromTo(`.${styles.titleWord}`, { scale: 1 }, { scale: 0.62, yPercent: -60, duration: 1 }, 0)
        .fromTo(`.${styles.panel}`, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 0.7)
      frames.slice(1).forEach((frame, i) => {
        tl.fromTo(frame, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 0.8 }, 1.3 + i)
          .fromTo(frame.querySelector('img'), { scale: 1.25 }, { scale: 1, duration: 0.8 }, '<')
      })
      tl.to({}, { duration: 0.4 })
    })
    return () => mm.revert()
  }, [shots.length])

  if (shots.length === 0) return null

  return (
    // Stable React-owned wrapper: GSAP inserts its pin-spacer inside it, never in <main>.
    <div>
    <section ref={root} className={styles.spotlight} aria-labelledby="spotlight-title">
      <div className={styles.frames}>
        {shots.map((p, i) => (
          <div key={p.slug} className={styles.frame} style={{ zIndex: i }}>
            <SunlitPicture media={p.photo!} sizes="100vw" className={styles.photo} alt={p.photo!.alt} />
          </div>
        ))}
        <div className={styles.shade} aria-hidden="true" />
      </div>

      <h2 id="spotlight-title" className={styles.title}>
        <span className={styles.titleWord}>{title}</span>
      </h2>

      <div className={styles.panel}>
        <p className="eyebrow">
          <span className="sun-text">(04)</span> À la une
        </p>
        <p className={styles.text}>{text}</p>
        <ul className={styles.links}>
          {products.map((p) => (
            <li key={p.slug}>
              <Link href={`/carte/${p.slug}`} className={styles.link}>
                <span>{p.name}</span>
                <span className={styles.linkMeta}>{p.price ?? p.category}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
    </div>
  )
}
