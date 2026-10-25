'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useEffectEvent, useRef } from 'react'
import { gsap, prefersReducedMotion, ScrollTrigger } from './gsap'
import { useLenis } from './MotionProvider'
import styles from './SunTransition.module.css'

type Phase = 'idle' | 'covering' | 'covered'

/** Paths that keep native navigation (no transition). */
const EXCLUDED = ['/admin', '/media', '/api']

/**
 * Signature n°2 — « Lever de soleil ».
 * Internal navigations are intercepted: a golden sun rises over the horizon until it fills the
 * screen, the route changes underneath, then the light lifts away to reveal the new page.
 */
export function SunTransition() {
  const router = useRouter()
  const pathname = usePathname()
  const lenis = useLenis()
  const root = useRef<HTMLDivElement>(null)
  const phase = useRef<Phase>('idle')

  const parts = () => {
    const el = root.current!
    return {
      el,
      sun: el.querySelector<HTMLElement>(`.${styles.sun}`)!,
      veil: el.querySelector<HTMLElement>(`.${styles.veil}`)!,
      word: el.querySelector<HTMLElement>(`.${styles.word}`)!,
    }
  }

  /** Lifts the light off the new page. Safe to call repeatedly: only acts while covered. */
  const reveal = useEffectEvent(() => {
    if (!root.current || phase.current !== 'covered') return
    phase.current = 'idle'
    const { el, sun, veil, word } = parts()

    const hash = window.location.hash
    const anchor = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null
    if (anchor) {
      if (lenis) lenis.scrollTo(anchor, { immediate: true, offset: -96 })
      else anchor.scrollIntoView()
    } else if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
    else window.scrollTo(0, 0)
    ScrollTrigger.refresh()

    gsap
      .timeline({
        delay: 0.08,
        defaults: { ease: 'expo.inOut' },
        onComplete: () => {
          el.dataset.active = 'false'
          lenis?.start()
        },
      })
      .to(word, { yPercent: -120, duration: 0.45, ease: 'power3.in' })
      .to(sun, { yPercent: -260, scale: 0.6, duration: 0.8 }, 0.1)
      .to(veil, { yPercent: -100, borderRadius: '0 0 50% 50% / 0 0 18vh 18vh', duration: 0.85 }, 0.12)
  })

  const cover = useEffectEvent((href: string) => {
    phase.current = 'covering'
    const { el, sun, veil, word } = parts()
    el.dataset.active = 'true'
    lenis?.stop()
    gsap
      .timeline({
        defaults: { ease: 'expo.inOut' },
        onComplete: () => {
          phase.current = 'covered'
          router.push(href, { scroll: false })
          // A navigation that never commits must not leave the screen covered.
          window.setTimeout(reveal, 6000)
        },
      })
      .set(veil, { yPercent: 100, borderRadius: '50% 50% 0 0 / 18vh 18vh 0 0' })
      .set(sun, { yPercent: 0, scale: 0.12, opacity: 1 })
      .set(word, { yPercent: 120, opacity: 1 })
      .to(sun, { yPercent: -62, scale: 0.42, duration: 0.55, ease: 'power3.out' })
      .to(veil, { yPercent: 0, borderRadius: '0% 0% 0 0 / 0vh 0vh 0 0', duration: 0.7 }, 0.18)
      .to(word, { yPercent: 0, duration: 0.6, ease: 'power4.out' }, 0.42)
  })

  useEffect(() => {
    if (prefersReducedMotion()) return
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element | null)?.closest?.('a')
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download') || 'noTransition' in anchor.dataset) return
      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin) return
      if (EXCLUDED.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`))) return
      if (url.pathname === window.location.pathname) return // anchors and filters keep native behaviour
      event.preventDefault()
      if (phase.current === 'idle') cover(url.pathname + url.search + url.hash)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  // The new route has rendered: reveal it.
  useEffect(() => {
    reveal()
  }, [pathname])

  return (
    <div ref={root} className={styles.root} data-active="false" aria-hidden="true">
      <div className={styles.veil}>
        <div className={styles.horizon} />
        <div className={styles.word}>
          Soleil <span className="serif">d’Or</span>
        </div>
      </div>
      <div className={styles.sun} />
    </div>
  )
}
