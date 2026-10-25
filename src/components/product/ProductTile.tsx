'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { Picture } from '@/components/ui/Picture'
import { prefersReducedMotion } from '@/components/motion/gsap'
import type { ProductSummary } from '@/lib/summary'
import styles from './ProductTile.module.css'

type Props = { product: ProductSummary; index?: number; sizes?: string; priority?: boolean }

/**
 * Product card: 3D tilt with a golden glare that follows the pointer (or the finger),
 * a sun rising behind the product on hover, and the name/price revealed from below.
 */
export function ProductTile({ product, index, sizes = '(max-width: 760px) 80vw, 30vw', priority }: Props) {
  const card = useRef<HTMLAnchorElement>(null)
  const frame = useRef(0)

  const move = (clientX: number, clientY: number) => {
    const el = card.current
    if (!el || prefersReducedMotion()) return
    const r = el.getBoundingClientRect()
    const x = (clientX - r.left) / r.width
    const y = (clientY - r.top) / r.height
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty('--rx', `${(0.5 - y) * 10}deg`)
      el.style.setProperty('--ry', `${(x - 0.5) * 14}deg`)
      el.style.setProperty('--gx', `${x * 100}%`)
      el.style.setProperty('--gy', `${y * 100}%`)
    })
  }
  const reset = () => {
    const el = card.current
    if (!el) return
    cancelAnimationFrame(frame.current)
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }

  const media = product.cutout ?? product.photo
  return (
    <Link
      ref={card}
      href={`/carte/${product.slug}`}
      className={styles.tile}
      data-cutout={Boolean(product.cutout)}
      data-unavailable={!product.available}
      onPointerMove={(e) => move(e.clientX, e.clientY)}
      onPointerLeave={reset}
      onPointerCancel={reset}
      onPointerUp={(e) => e.pointerType === 'touch' && reset()}
    >
      <div className={styles.inner}>
        <div className={styles.top}>
          {index !== undefined && <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>}
          {(product.badge || !product.available) && (
            <span className={styles.badge} data-kind={product.available ? 'badge' : 'off'}>
              {product.available ? product.badge : 'Indisponible'}
            </span>
          )}
          <span className={styles.category}>{product.category}</span>
        </div>

        <div className={styles.visual}>
          <div className={styles.sun} aria-hidden="true" />
          {media &&
            (product.cutout ? (
              <Picture media={media} bare sizes={sizes} priority={priority} alt="" imgClassName={styles.cutout} />
            ) : (
              <Picture media={media} sizes={sizes} priority={priority} alt="" className={styles.photo} />
            ))}
        </div>

        <div className={styles.bottom}>
          <h3 className={styles.name}>{product.name}</h3>
          <div className={styles.reveal}>
            <span className={styles.price}>{product.price ?? 'Voir le détail'}</span>
            <span className={styles.arrow} aria-hidden="true">
              →
            </span>
          </div>
        </div>

        <div className={styles.glare} aria-hidden="true" />
      </div>
    </Link>
  )
}
