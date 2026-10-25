'use client'

import { useEffect, useRef } from 'react'
import { Picture } from '@/components/ui/Picture'
import { SunlitPicture } from '@/components/ui/SunlitPicture'
import { isTouch, prefersReducedMotion } from '@/components/motion/gsap'
import type { Media } from '@/lib/types'
import styles from './ProductStage.module.css'

/** « Éclipse »: the cut-out product floats in front of a slowly turning sun. Falls back to the sunlit photo. */
export function ProductStage({ cutout, photo, name }: { cutout: Media | null; photo: Media | null; name: string }) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || !cutout || isTouch() || prefersReducedMotion()) return
    let frame = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const x = e.clientX / window.innerWidth - 0.5
        const y = e.clientY / window.innerHeight - 0.5
        el.style.setProperty('--tx', x.toFixed(3))
        el.style.setProperty('--ty', y.toFixed(3))
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
    }
  }, [cutout])

  if (cutout) {
    return (
      <div ref={root} className={styles.stage}>
        <div className={styles.rays} aria-hidden="true" />
        <div className={styles.sun} aria-hidden="true" />
        <div className={styles.float}>
          <Picture media={cutout} bare priority sizes="(max-width: 960px) 90vw, 50vw" alt={name} imgClassName={styles.cutout} />
        </div>
        <div className={styles.shadow} aria-hidden="true" />
      </div>
    )
  }
  if (photo) {
    return (
      <div className={styles.photoStage}>
        <SunlitPicture media={photo} priority sizes="(max-width: 960px) 100vw, 50vw" alt={photo.alt || name} className={styles.photo} />
      </div>
    )
  }
  return (
    <div className={styles.stage} aria-hidden="true">
      <div className={styles.sun} />
    </div>
  )
}
