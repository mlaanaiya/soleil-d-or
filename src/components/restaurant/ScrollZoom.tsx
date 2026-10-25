'use client'

import { useEffect, useRef } from 'react'
import { Picture } from '@/components/ui/Picture'
import { gsap } from '@/components/motion/gsap'
import type { Media } from '@/lib/types'
import styles from './Restaurant.module.css'

/** A close-up that keeps zooming into the food while it crosses the viewport. */
export function ScrollZoom({ media, focus, label }: { media: Media; focus: string; label: string }) {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        el.querySelector('img'),
        { scale: 1.15 },
        { scale: 2.1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } },
      )
    })
    return () => mm.revert()
  }, [])

  return (
    <figure ref={root} className={styles.zoom}>
      <Picture media={media} sizes="(max-width: 760px) 100vw, 50vw" focus={focus} className={styles.zoomPic} alt={media.alt} />
      <figcaption className={styles.zoomLabel}>{label}</figcaption>
    </figure>
  )
}
