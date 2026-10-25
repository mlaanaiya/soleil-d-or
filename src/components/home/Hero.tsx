'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Picture, mediaUrl } from '@/components/ui/Picture'
import { isTouch, prefersReducedMotion } from '@/components/motion/gsap'
import type { Media } from '@/lib/types'
import styles from './Hero.module.css'

export type HeroProduct = {
  slug: string
  name: string
  category: string
  price: string | null
  cutout: Media
}

type Props = {
  name: string
  kicker: string
  tagline: string
  products: HeroProduct[]
  cta: { href: string; label: string }
  secondary: { href: string; label: string }
}

const ROTATE_MS = 6500

export function Hero({ name, kicker, tagline, products, cta, secondary }: Props) {
  const stage = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  // Secondary products and light masks wait for the page load, so they never compete with the first paint.
  const [loaded, setLoaded] = useState(false)
  const [first, ...rest] = name.split(' ')
  const accent = rest.join(' ')

  /* Pointer depth + sunlight. Values are eased in a rAF loop and written as CSS variables. */
  useEffect(() => {
    const el = stage.current
    if (!el || prefersReducedMotion()) return
    if (isTouch()) {
      // Ambient drift only while the hero is on screen.
      const io = new IntersectionObserver(([entry]) => (el.dataset.auto = entry?.isIntersecting ? 'true' : 'paused'))
      io.observe(el)
      return () => io.disconnect()
    }
    let px = 0
    let py = 0
    let tx = 0
    let ty = 0
    let lx = 50
    let ly = 40
    let tlx = 50
    let tly = 40
    let frame = 0
    const loop = () => {
      px += (tx - px) * 0.08
      py += (ty - py) * 0.08
      lx += (tlx - lx) * 0.12
      ly += (tly - ly) * 0.12
      el.style.setProperty('--px', px.toFixed(4))
      el.style.setProperty('--py', py.toFixed(4))
      el.style.setProperty('--lx', `${lx.toFixed(2)}%`)
      el.style.setProperty('--ly', `${ly.toFixed(2)}%`)
      const moving = Math.abs(tx - px) + Math.abs(ty - py) + Math.abs(tlx - lx) / 100 + Math.abs(tly - ly) / 100 > 0.001
      frame = moving ? requestAnimationFrame(loop) : 0
    }
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      tx = ((e.clientX - r.left) / r.width) * 2 - 1
      ty = ((e.clientY - r.top) / r.height) * 2 - 1
      const product = el.querySelector<HTMLElement>(`.${styles.product}[data-active='true'] .${styles.tilt}`)
      if (product) {
        const pr = product.getBoundingClientRect()
        tlx = ((e.clientX - pr.left) / pr.width) * 100
        tly = ((e.clientY - pr.top) / pr.height) * 100
      }
      if (!frame) frame = requestAnimationFrame(loop)
    }
    const onLeave = () => {
      tx = 0
      ty = 0
      tlx = 50
      tly = 40
      if (!frame) frame = requestAnimationFrame(loop)
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  useEffect(() => {
    const ready = () => setLoaded(true)
    if (document.readyState === 'complete') {
      const id = window.setTimeout(ready, 0)
      return () => window.clearTimeout(id)
    }
    window.addEventListener('load', ready, { once: true })
    return () => window.removeEventListener('load', ready)
  }, [])

  /* Auto-rotation, paused while hovered/focused, off-screen or in a background tab. */
  useEffect(() => {
    if (products.length < 2 || paused || !loaded || prefersReducedMotion()) return
    const el = stage.current
    let visible = true
    const io = new IntersectionObserver(([entry]) => (visible = Boolean(entry?.isIntersecting)))
    if (el) io.observe(el)
    const id = window.setInterval(() => {
      if (visible && document.visibilityState === 'visible') setActive((i) => (i + 1) % products.length)
    }, ROTATE_MS)
    return () => {
      window.clearInterval(id)
      io.disconnect()
    }
  }, [products.length, paused, loaded])

  const select = useCallback((i: number) => setActive(i), [])
  const current = products[active]

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div
        ref={stage}
        className={styles.stage}
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
      >
        <div className={styles.sky} aria-hidden="true" />
        <div
          className={`${styles.layer} ${styles.sunLayer}`}
          style={{ '--depth': 0.25 } as CSSProperties}
          aria-hidden="true"
        >
          <div className={styles.sun} />
        </div>

        <h1 id="hero-title" className={styles.title}>
          <span className="visually-hidden">
            {name} — {kicker}
          </span>
          <span className={styles.layer} style={{ '--depth': 0.45 } as CSSProperties} aria-hidden="true">
            <span className={styles.word}>
              {first!.split('').map((c, i) => (
                <span key={i} className={styles.letter} style={{ '--i': i } as CSSProperties}>
                  {c}
                </span>
              ))}
            </span>
          </span>
        </h1>

        <div className={styles.horizon} aria-hidden="true" />

        <div className={`${styles.layer} ${styles.products}`} style={{ '--depth': 1 } as CSSProperties}>
          <div className={styles.productsIntro}>
            {products.map((p, i) => (
              <figure key={p.slug} className={styles.product} data-active={i === active} aria-hidden={i !== active}>
                <div className={styles.tilt}>
                  {(i === 0 || loaded) && (
                    <Picture
                      media={p.cutout}
                      bare
                      priority={i === 0}
                      sizes="(max-width: 760px) 72vw, (max-width: 1400px) 44vw, 640px"
                      alt={p.name}
                    />
                  )}
                  <div
                    className={styles.light}
                    style={loaded ? ({ '--mask': `url(${mediaUrl(p.cutout, 800)})` } as CSSProperties) : undefined}
                    aria-hidden="true"
                  >
                    <span className={styles.beam} />
                  </div>
                </div>
                <div className={styles.shadow} aria-hidden="true" />
              </figure>
            ))}
          </div>
        </div>

        {accent && (
          <span className={`serif ${styles.accent}`} aria-hidden="true">
            {accent}
          </span>
        )}
      </div>

      <div className={styles.meta}>
        <p className={`eyebrow ${styles.kicker}`}>
          <span className={styles.kickerDot} aria-hidden="true" />
          {kicker}
        </p>

        <div className={styles.bottom}>
          <p className={styles.tagline}>{tagline}</p>

          {products.length > 0 && current && (
            <div className={styles.switcher} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
              <Link href={`/carte/${current.slug}`} className={styles.caption} key={current.slug}>
                <span className={styles.captionIndex}>
                  {String(active + 1).padStart(2, '0')} / {String(products.length).padStart(2, '0')}
                </span>
                <span className={styles.captionName}>{current.name}</span>
                <span className={styles.captionMeta}>
                  {current.category}
                  {current.price ? ` · ${current.price}` : ''}
                </span>
              </Link>
              {products.length > 1 && (
                <div className={styles.dots} role="group" aria-label="Choisir le produit mis en avant">
                  {products.map((p, i) => (
                    <button
                      key={p.slug}
                      type="button"
                      className={styles.dot}
                      aria-pressed={i === active}
                      aria-label={p.name}
                      onClick={() => select(i)}
                    >
                      <span className={styles.dotFill} data-running={i === active && !paused} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className={styles.ctas}>
            <Link href={cta.href} className="btn">
              {cta.label}
              <span className="btn-dot" aria-hidden="true" />
            </Link>
            <Link href={secondary.href} className="btn btn--ghost">
              {secondary.label}
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.scrollCue} aria-hidden="true">
        <span>Défiler</span>
        <span className={styles.scrollLine} />
      </div>
    </section>
  )
}
