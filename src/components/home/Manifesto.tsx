'use client'

import { useEffect, useRef } from 'react'
import { Picture } from '@/components/ui/Picture'
import { gsap, prefersReducedMotion } from '@/components/motion/gsap'
import type { Media } from '@/lib/types'
import styles from './Manifesto.module.css'

/** The text « takes the sun »: words light up one by one while scrolling; a stamp turns like a dial. */
export function Manifesto({ text, name, photo }: { text: string; name: string; photo: Media | null }) {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        `.${styles.word}`,
        { opacity: 0.4 }, // ≥ 3:1 contrast even in the dim state (large text)
        {
          opacity: 1,
          stagger: 0.08,
          ease: 'none',
          scrollTrigger: { trigger: `.${styles.text}`, start: 'top 78%', end: 'bottom 45%', scrub: 0.4 },
        },
      )
      gsap.to(`.${styles.ring}`, {
        rotate: 220,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
      })
      gsap.fromTo(
        `.${styles.stamp}`,
        { yPercent: 30 },
        {
          yPercent: -30,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      )
    }, el)
    return () => ctx.revert()
  }, [])

  const ring = `${name} · ${name} · ${name} · `.toUpperCase()

  return (
    <section ref={root} className={`section ${styles.manifesto}`} aria-labelledby="manifesto-title">
      <div className={`container ${styles.grid}`}>
        <p className={`eyebrow ${styles.label}`} id="manifesto-title">
          <span className={styles.num}>(01)</span> L’univers
        </p>
        <p className={styles.text}>
          {text.split(/\s+/).map((w, i) => (
            <span key={i} className={styles.word}>
              {w}{' '}
            </span>
          ))}
        </p>
        <div className={styles.stamp} aria-hidden="true">
          {photo && <Picture media={photo} sizes="260px" className={styles.disc} alt="" />}
          <svg viewBox="0 0 200 200" className={styles.ring}>
            <defs>
              <path id="ring-path" d="M100,100 m-84,0 a84,84 0 1,1 168,0 a84,84 0 1,1 -168,0" />
            </defs>
            <text>
              <textPath href="#ring-path" startOffset="0">
                {ring}
              </textPath>
            </text>
          </svg>
        </div>
      </div>
    </section>
  )
}
