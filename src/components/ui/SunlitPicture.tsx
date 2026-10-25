'use client'

import { useEffect, useRef } from 'react'
import { isTouch, prefersReducedMotion } from '@/components/motion/gsap'
import type { Media } from '@/lib/types'
import { Picture } from './Picture'
import styles from './SunlitPicture.module.css'

type Props = { media: Media; sizes: string; alt?: string; className?: string; priority?: boolean; focus?: string }

/**
 * Signature n°1 — « La lumière » applied to full photographs: the image rests in shadow and the
 * pointer becomes a sun that brings it back to full light. Touch screens get a slow drifting sun.
 */
export function SunlitPicture({ media, sizes, alt, className, priority, focus }: Props) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || prefersReducedMotion()) return
    if (isTouch()) {
      el.dataset.auto = 'true'
      return
    }
    let x = 50
    let y = 45
    let tx = x
    let ty = y
    let frame = 0
    const loop = () => {
      x += (tx - x) * 0.12
      y += (ty - y) * 0.12
      el.style.setProperty('--sx', `${x.toFixed(2)}%`)
      el.style.setProperty('--sy', `${y.toFixed(2)}%`)
      frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.05 ? requestAnimationFrame(loop) : 0
    }
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      tx = ((e.clientX - r.left) / r.width) * 100
      ty = ((e.clientY - r.top) / r.height) * 100
      el.dataset.lit = 'true'
      if (!frame) frame = requestAnimationFrame(loop)
    }
    const onLeave = () => {
      el.dataset.lit = 'false'
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <div ref={root} className={`${styles.sunlit} ${className ?? ''}`} data-lit="false">
      <Picture media={media} sizes={sizes} alt={alt} priority={priority} focus={focus} className={styles.base} />
      <div className={styles.lit} aria-hidden="true">
        <Picture media={media} sizes={sizes} alt="" focus={focus} className={styles.base} />
      </div>
      <div className={styles.flare} aria-hidden="true" />
    </div>
  )
}
