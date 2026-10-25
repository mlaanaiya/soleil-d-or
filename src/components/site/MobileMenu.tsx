'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { NAV } from '@/lib/site'
import { telHref } from '@/lib/format'
import { useLenis } from '../motion/MotionProvider'
import type { ChromeProps } from './Header'
import styles from './MobileMenu.module.css'

type Props = ChromeProps & { open: boolean; onClose: () => void; isActive: (href: string) => boolean }

export function MobileMenu({ open, onClose, isActive, status, phone, directions, socials, cta }: Props) {
  const panel = useRef<HTMLDivElement>(null)
  const lenis = useLenis()

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    lenis?.stop()
    document.documentElement.style.overflow = 'hidden'
    const first = panel.current?.querySelector<HTMLElement>('a, button')
    first?.focus({ preventScroll: true })

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key !== 'Tab' || !panel.current) return
      const focusables = panel.current.querySelectorAll<HTMLElement>('a, button')
      const firstEl = focusables[0]
      const lastEl = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl?.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = ''
      lenis?.start()
      previous?.focus({ preventScroll: true })
    }
  }, [open, onClose, lenis])

  return (
    <div
      id="mobile-menu"
      ref={panel}
      className={styles.menu}
      data-open={open}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      inert={!open}
    >
      <nav className={styles.nav} aria-label="Navigation mobile">
        <ul>
          <li style={{ '--i': 0 } as React.CSSProperties}>
            <Link href="/" className={styles.link} aria-current={isActive('/') && !NAV.some((n) => isActive(n.href)) ? 'page' : undefined}>
              <span className={styles.index}>00</span>Accueil
            </Link>
          </li>
          {NAV.map((item, i) => (
            <li key={item.href} style={{ '--i': i + 1 } as React.CSSProperties}>
              <Link href={item.href} className={styles.link} aria-current={isActive(item.href) ? 'page' : undefined}>
                <span className={styles.index}>{String(i + 1).padStart(2, '0')}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.bottom}>
        <div className={styles.sun} aria-hidden="true" />
        {status.state !== 'unknown' && (
          <p className={styles.status}>
            <span className="status-dot" data-state={status.state} /> {status.label}
          </p>
        )}
        <div className={styles.quick}>
          <Link href={cta.href} className="btn">
            {cta.label}
          </Link>
          {phone && (
            <a href={telHref(phone)} className="btn btn--ghost">
              Appeler
            </a>
          )}
          {directions && (
            <a href={directions} className="btn btn--ghost" target="_blank" rel="noopener noreferrer">
              Itinéraire
            </a>
          )}
        </div>
        {socials.length > 0 && (
          <ul className={styles.socials}>
            {socials.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="link-underline">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
