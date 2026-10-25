'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Picture } from '@/components/ui/Picture'
import { useLenis } from '@/components/motion/MotionProvider'
import type { Media } from '@/lib/types'
import styles from './GalleryWall.module.css'

export type WallShot = {
  media: Media
  caption: string
  href: string | null
  categorySlug: string | null
  categoryName: string | null
}

/** Repeating rhythm of frame shapes so the wall never reads as a uniform grid. */
const SHAPES = ['wide', 'tall', 'square', 'square', 'wide', 'tall', 'square', 'wide', 'square'] as const

export function GalleryWall({ shots }: { shots: WallShot[] }) {
  const lenis = useLenis()
  const [filter, setFilter] = useState<string | null>(null)
  const [open, setOpen] = useState<number | null>(null)
  const [origin, setOrigin] = useState({ x: 50, y: 50 })
  const dialog = useRef<HTMLDivElement>(null)
  const touchX = useRef<number | null>(null)
  const lastTrigger = useRef<HTMLElement | null>(null)

  const categories = useMemo(() => {
    const seen = new Map<string, string>()
    shots.forEach((s) => s.categorySlug && s.categoryName && seen.set(s.categorySlug, s.categoryName))
    return [...seen.entries()]
  }, [shots])
  const visible = filter ? shots.filter((s) => s.categorySlug === filter) : shots

  const close = useCallback(() => setOpen(null), [])
  const step = useCallback(
    (d: number) => setOpen((i) => (i === null ? null : (i + d + visible.length) % visible.length)),
    [visible.length],
  )

  useEffect(() => {
    if (open === null) return
    lenis?.stop()
    document.documentElement.style.overflow = 'hidden'
    dialog.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
      if (e.key === 'Tab' && dialog.current) {
        const f = dialog.current.querySelectorAll<HTMLElement>('button, a')
        if (f.length === 0) return
        if (e.shiftKey && document.activeElement === f[0]) {
          e.preventDefault()
          f[f.length - 1]!.focus()
        } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
          e.preventDefault()
          f[0]!.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = ''
      lenis?.start()
      lastTrigger.current?.focus({ preventScroll: true })
    }
    // Only (re)bind when opening/closing, not on every slide change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open === null, close, step, lenis])

  const openAt = (i: number) => (e: React.MouseEvent<HTMLButtonElement>) => {
    lastTrigger.current = e.currentTarget
    setOrigin({ x: (e.clientX / window.innerWidth) * 100 || 50, y: (e.clientY / window.innerHeight) * 100 || 50 })
    setOpen(i)
  }

  const current = open !== null ? visible[open] : null

  return (
    <>
      {categories.length > 1 && (
        <div className={styles.filters} role="group" aria-label="Filtrer la galerie">
          <button type="button" aria-pressed={filter === null} onClick={() => setFilter(null)}>
            Tout <span>{shots.length}</span>
          </button>
          {categories.map(([slug, name]) => (
            <button key={slug} type="button" aria-pressed={filter === slug} onClick={() => setFilter(slug)}>
              {name} <span>{shots.filter((s) => s.categorySlug === slug).length}</span>
            </button>
          ))}
        </div>
      )}

      <ul className={styles.wall} key={filter ?? 'all'}>
        {visible.map((s, i) => (
          <li key={s.media.id} className={styles.cell} data-shape={SHAPES[i % SHAPES.length]}>
            <button type="button" className={styles.open} onClick={openAt(i)} aria-label={`Agrandir : ${s.caption}`}>
              <figure data-reveal="mask" style={{ '--d': `${(i % 4) * 0.06}s` } as React.CSSProperties}>
                <Picture
                  media={s.media}
                  sizes="(max-width: 760px) 100vw, (max-width: 1200px) 50vw, 34vw"
                  className={styles.pic}
                />
              </figure>
              <span className={styles.caption}>
                <span className="serif">{s.caption}</span>
                {s.categoryName && <span className={styles.cat}>{s.categoryName}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div
        ref={dialog}
        className={styles.lightbox}
        data-open={current ? 'true' : 'false'}
        style={{ '--ox': `${origin.x}%`, '--oy': `${origin.y}%` } as React.CSSProperties}
        role="dialog"
        aria-modal="true"
        aria-label={current ? current.caption : 'Visionneuse'}
        tabIndex={-1}
        inert={!current}
        onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          const start = touchX.current
          const end = e.changedTouches[0]?.clientX
          if (start != null && end != null && Math.abs(end - start) > 50) step(end < start ? 1 : -1)
          touchX.current = null
        }}
      >
        {current && (
          <>
            <figure className={styles.stage} key={current.media.id}>
              <Picture media={current.media} sizes="100vw" className={styles.stagePic} priority />
              <figcaption className={styles.stageCaption}>
                <span className={styles.counter}>
                  {String(open! + 1).padStart(2, '0')} / {String(visible.length).padStart(2, '0')}
                </span>
                <span className={styles.stageName}>{current.caption}</span>
                {current.href && (
                  <Link href={current.href} className="btn" onClick={close}>
                    Voir le produit
                  </Link>
                )}
              </figcaption>
            </figure>
            <button
              type="button"
              className={`${styles.nav} ${styles.prev}`}
              onClick={() => step(-1)}
              aria-label="Photo précédente"
            >
              ←
            </button>
            <button
              type="button"
              className={`${styles.nav} ${styles.next}`}
              onClick={() => step(1)}
              aria-label="Photo suivante"
            >
              →
            </button>
            <button type="button" className={styles.close} onClick={close} aria-label="Fermer la visionneuse">
              Fermer
            </button>
          </>
        )}
      </div>
    </>
  )
}
