'use client'

import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion, ScrollTrigger } from '../motion/gsap'
import styles from './Footer.module.css'

/** The page ends at dusk: the sun sinks behind the giant wordmark as the footer arrives. */
export function Sunset({ name }: { name: string }) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom bottom', scrub: 0.6 },
      })
      tl.fromTo(`.${styles.sun}`, { yPercent: -55 }, { yPercent: 18, ease: 'none' }, 0)
        .fromTo(`.${styles.glow}`, { opacity: 1 }, { opacity: 0.35, ease: 'none' }, 0)
        .fromTo(`.${styles.letters} span`, { yPercent: 40 }, { yPercent: 0, stagger: 0.03, ease: 'power2.out' }, 0)
    }, el)
    ScrollTrigger.refresh()
    return () => ctx.revert()
  }, [])

  const [first, ...rest] = name.split(' ')
  return (
    <div ref={root} className={styles.sunset} aria-hidden="true">
      <div className={styles.glow} />
      <div className={styles.sun} />
      <div className={styles.letters}>
        {first!.split('').map((c, i) => (
          <span key={i}>{c}</span>
        ))}
        {rest.length > 0 && <span className={`serif ${styles.serifWord}`}>&nbsp;{rest.join(' ')}</span>}
      </div>
      <div className={styles.horizonLine} />
    </div>
  )
}
