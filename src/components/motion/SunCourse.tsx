'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from './gsap'
import styles from './SunCourse.module.css'

const R = 26
const CX = 32
const CY = 32

/** Golden-hour clock: the top of the page is dawn (06:00), the footer is dusk (21:30). */
function clockFor(progress: number) {
  const minutes = Math.round(6 * 60 + progress * (15.5 * 60))
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

/**
 * Signature n°3 — « La course du soleil ».
 * Scroll progress is drawn as the sun's path across the sky; the ambient light of the page
 * follows it, warming from dawn to dusk. Only transforms/opacity are animated.
 */
export function SunCourse() {
  const pathname = usePathname()
  const sun = useRef<SVGCircleElement>(null)
  const trail = useRef<SVGPathElement>(null)
  const clock = useRef<HTMLSpanElement>(null)
  const ambient = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const reduced = prefersReducedMotion()
    let frame = 0
    let last = -1
    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      if (Math.abs(p - last) < 0.0005) return
      last = p
      const angle = Math.PI * (1 - p)
      sun.current?.setAttribute('cx', String(CX + R * Math.cos(angle)))
      sun.current?.setAttribute('cy', String(CY - R * Math.sin(angle)))
      if (trail.current) trail.current.style.strokeDashoffset = String(1 - p)
      if (clock.current) clock.current.textContent = clockFor(p)
      if (ambient.current && !reduced) {
        // Light rises then sets: highest in the middle of the page, warmer and lower at dusk.
        const height = Math.sin(Math.PI * p)
        ambient.current.style.transform = `translate3d(${(p - 0.5) * 40}vw, ${(1 - height) * 38}vh, 0)`
        ambient.current.style.opacity = String(0.38 + height * 0.42)
        ambient.current.style.setProperty('--dusk', String(p))
      }
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [pathname])

  return (
    <>
      <div className={styles.ambientWrap} aria-hidden="true">
        <div ref={ambient} className={styles.ambient} />
      </div>
      <div className={styles.course} aria-hidden="true">
        <svg viewBox="0 0 64 36" width="64" height="36">
          <path d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`} className={styles.arc} />
          <path
            ref={trail}
            d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
            className={styles.trail}
            pathLength={1}
          />
          <line x1="0" y1={CY} x2="64" y2={CY} className={styles.horizon} />
          <circle ref={sun} cx={CX - R} cy={CY} r="4.5" className={styles.sun} />
        </svg>
        <span ref={clock} className={styles.clock}>
          06:00
        </span>
      </div>
    </>
  )
}
