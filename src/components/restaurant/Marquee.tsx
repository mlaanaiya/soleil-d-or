'use client'

import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '@/components/motion/gsap'
import styles from './Restaurant.module.css'

/** Endless band of words whose speed follows scroll velocity. */
export function Marquee({ words }: { words: string[] }) {
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = track.current
    if (!el || prefersReducedMotion()) return
    let x = 0
    let lastY = window.scrollY
    let boost = 0
    let frame = 0
    const loop = () => {
      const y = window.scrollY
      boost = boost * 0.9 + Math.min(40, Math.abs(y - lastY)) * 0.1
      lastY = y
      x -= 0.6 + boost * 0.5
      const half = el.scrollWidth / 2
      if (-x >= half) x += half
      el.style.transform = `translate3d(${x}px, 0, 0)`
      frame = requestAnimationFrame(loop)
    }
    const io = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame)
      if (entry?.isIntersecting) frame = requestAnimationFrame(loop)
    })
    io.observe(el)
    return () => {
      cancelAnimationFrame(frame)
      io.disconnect()
    }
  }, [])

  const row = words.map((w, i) => (
    <span key={i} className={styles.marqueeItem}>
      {w}
      <span className={styles.marqueeSun} aria-hidden="true" />
    </span>
  ))
  return (
    <div className={styles.marquee} aria-hidden="true">
      <div ref={track} className={styles.marqueeTrack}>
        {row}
        {row}
      </div>
    </div>
  )
}
