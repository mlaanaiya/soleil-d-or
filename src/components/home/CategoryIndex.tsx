'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Picture } from '@/components/ui/Picture'
import { isTouch, prefersReducedMotion } from '@/components/motion/gsap'
import type { Media } from '@/lib/types'
import styles from './CategoryIndex.module.css'

export type CategoryRow = { slug: string; name: string; tagline: string; count: number; cover: Media | null }

/** Typographic index of the menu; on desktop a sun-shaped photo follows the pointer over each row. */
export function CategoryIndex({ title, categories }: { title: string; categories: CategoryRow[] }) {
  const list = useRef<HTMLDivElement>(null)
  const follower = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<number | null>(null)

  useEffect(() => {
    const el = list.current
    const f = follower.current
    if (!el || !f || isTouch() || prefersReducedMotion()) return
    let x = 0
    let y = 0
    let tx = 0
    let ty = 0
    let frame = 0
    const loop = () => {
      x += (tx - x) * 0.16
      y += (ty - y) * 0.16
      f.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${(tx - x) * 0.04}deg)`
      frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.4 ? requestAnimationFrame(loop) : 0
    }
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      tx = e.clientX - r.left
      ty = e.clientY - r.top
      if (!frame) frame = requestAnimationFrame(loop)
    }
    el.addEventListener('pointermove', onMove)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('pointermove', onMove)
    }
  }, [])

  return (
    <section className={`section ${styles.section}`} aria-labelledby="categories-title">
      <div className="container">
        <header className={styles.head}>
          <p className="eyebrow">
            <span className="sun-text">(03)</span> La carte
          </p>
          <h2 id="categories-title" className={styles.title} data-reveal="up">
            {title}
          </h2>
        </header>

        <div ref={list} className={styles.listWrap} onPointerLeave={() => setHovered(null)}>
          <ul className={styles.list}>
            {categories.map((c, i) => (
              <li key={c.slug} onPointerEnter={() => setHovered(i)}>
                <Link href={`/carte#${c.slug}`} className={styles.row} data-active={hovered === i}>
                  <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
                  <span className={styles.name}>{c.name}</span>
                  <span className={styles.tagline}>{c.tagline}</span>
                  <span className={styles.count}>
                    {c.count > 0 ? `${c.count} produit${c.count > 1 ? 's' : ''}` : 'Bientôt'}
                  </span>
                  {c.cover && (
                    <span className={styles.thumb} aria-hidden="true">
                      <Picture media={c.cover} sizes="80px" alt="" />
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          <div ref={follower} className={styles.follower} data-visible={hovered !== null} aria-hidden="true">
            {categories.map((c, i) =>
              c.cover ? (
                <div key={c.slug} className={styles.followerImg} data-active={hovered === i}>
                  <Picture media={c.cover} sizes="360px" alt="" />
                </div>
              ) : null,
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
