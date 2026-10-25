'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { telHref } from '@/lib/format'
import styles from './MobileDock.module.css'

type Props = { phone: string; directions: string | null; cta: { href: string; label: string } | null }

/** Thumb-zone action bar for phones: the essentials are always one tap away. */
export function MobileDock({ phone, directions, cta }: Props) {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const nearBottom = window.innerHeight + window.scrollY > document.documentElement.scrollHeight - 80
      setVisible(window.scrollY > window.innerHeight * 0.5 && !nearBottom)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  if (pathname.startsWith('/commander') || pathname.startsWith('/reserver')) return null

  return (
    <nav className={styles.dock} data-visible={visible} aria-label="Actions rapides">
      {pathname !== '/carte' && (
        <Link href="/carte" className={styles.item}>
          <span className={styles.icon} aria-hidden="true">
            <svg viewBox="0 0 20 20" width="18" height="18">
              <path d="M4 5h12M4 10h12M4 15h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
            </svg>
          </span>
          Carte
        </Link>
      )}
      {phone && (
        <a href={telHref(phone)} className={styles.item}>
          <span className={styles.icon} aria-hidden="true">
            <svg viewBox="0 0 20 20" width="18" height="18">
              <path
                d="M6.5 3.5 4 4.2c-.6 4.9 6.9 12.4 11.8 11.8l.7-2.5-3.2-1.6-1.4 1.3c-1.7-.7-3.4-2.4-4.1-4.1l1.3-1.4z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </span>
          Appeler
        </a>
      )}
      {directions && (
        <a href={directions} className={styles.item} target="_blank" rel="noopener noreferrer">
          <span className={styles.icon} aria-hidden="true">
            <svg viewBox="0 0 20 20" width="18" height="18">
              <path d="M10 18s5.5-5.2 5.5-9.5a5.5 5.5 0 1 0-11 0C4.5 12.8 10 18 10 18z" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <circle cx="10" cy="8.5" r="2" fill="currentColor" />
            </svg>
          </span>
          Y aller
        </a>
      )}
      {cta && (
        <Link href={cta.href} className={`${styles.item} ${styles.primary}`}>
          {cta.label}
        </Link>
      )}
    </nav>
  )
}
