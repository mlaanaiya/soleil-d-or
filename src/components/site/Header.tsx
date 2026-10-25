'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { NAV } from '@/lib/site'
import { Logo } from './Logo'
import { MobileMenu } from './MobileMenu'
import styles from './Header.module.css'

export type ChromeProps = {
  name: string
  status: { state: 'open' | 'closed' | 'unknown'; label: string }
  cta: { href: string; label: string }
  phone: string
  directions: string | null
  socials: Array<{ url: string; label: string }>
}

export function Header(props: ChromeProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [solid, setSolid] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setSolid(y > 24)
      setHidden(y > 160 && y > lastY.current + 2)
      if (y < lastY.current - 2 || y < 160) setHidden(false)
      lastY.current = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lets sticky page toolbars sit right under the header when it is visible.
  useEffect(() => {
    document.documentElement.dataset.header = hidden && !open ? 'hidden' : 'shown'
  }, [hidden, open])

  // Close the menu whenever the route changes.
  const [menuPath, setMenuPath] = useState(pathname)
  if (menuPath !== pathname) {
    setMenuPath(pathname)
    setOpen(false)
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <>
      <header
        className={styles.header}
        data-hidden={hidden && !open ? 'true' : 'false'}
        data-solid={solid && !open ? 'true' : 'false'}
      >
        <div className={styles.inner}>
          <Link href="/" className={styles.brand} aria-label={`${props.name} — accueil`}>
            <Logo name={props.name} />
          </Link>

          <nav className={styles.nav} aria-label="Navigation principale">
            <ul>
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={styles.link}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.actions}>
            {props.status.state !== 'unknown' && (
              <span className={styles.status}>
                <span className="status-dot" data-state={props.status.state} />
                {props.status.label}
              </span>
            )}
            <Link href={props.cta.href} className={`btn ${styles.cta}`}>
              {props.cta.label}
              <span className="btn-dot" aria-hidden="true" />
            </Link>
            <button
              type="button"
              className={styles.burger}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="visually-hidden">{open ? 'Fermer le menu' : 'Ouvrir le menu'}</span>
              <span className={styles.burgerLabel} aria-hidden="true">
                {open ? 'Fermer' : 'Menu'}
              </span>
              <span className={styles.burgerIcon} aria-hidden="true" data-open={open}>
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
      </header>
      <MobileMenu {...props} open={open} onClose={() => setOpen(false)} isActive={isActive} />
    </>
  )
}
