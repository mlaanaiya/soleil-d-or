'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { logout } from '@/app/admin/_actions/account'
import { SunMark } from '@/components/site/Logo'

type Props = {
  username: string
  counts: { orders: number; reservations: number }
  showOrders: boolean
  showReservations: boolean
  children: React.ReactNode
}

export function AdminShell({ username, counts, showOrders, showReservations, children }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setOpen(false)
  }
  const current = (href: string) =>
    (href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`))
      ? 'page'
      : undefined

  const groups: Array<{ title: string; links: Array<{ href: string; label: string; count?: number }> }> = [
    { title: 'Accueil', links: [{ href: '/admin', label: 'Tableau de bord' }] },
    {
      title: 'Carte',
      links: [
        { href: '/admin/produits', label: 'Produits & prix' },
        { href: '/admin/categories', label: 'Catégories' },
        { href: '/admin/photos', label: 'Photos & galerie' },
      ],
    },
    {
      title: 'Restaurant',
      links: [
        { href: '/admin/horaires', label: 'Horaires' },
        { href: '/admin/informations', label: 'Informations & services' },
        { href: '/admin/contenus', label: 'Textes du site' },
      ],
    },
  ]
  const activity = [
    ...(showOrders ? [{ href: '/admin/commandes', label: 'Commandes', count: counts.orders }] : []),
    ...(showReservations ? [{ href: '/admin/reservations', label: 'Réservations', count: counts.reservations }] : []),
  ]
  if (activity.length > 0) groups.splice(1, 0, { title: 'Activité', links: activity })

  return (
    <div className="adm-shell">
      <div className="adm-topbar">
        <Link href="/admin" className="adm-brand">
          Soleil <span>d’Or</span>
        </Link>
        <button type="button" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="adm-side">
          Menu{counts.orders + counts.reservations > 0 ? ` (${counts.orders + counts.reservations})` : ''}
        </button>
      </div>
      <aside
        id="adm-side"
        className="adm-side"
        data-open={open}
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
      >
        <Link href="/admin" className="adm-brand">
          <SunMark size={26} className="adm-mark" />
          <div>
            Soleil <span>d’Or</span>
            <small>Administration</small>
          </div>
        </Link>
        <nav className="adm-nav" aria-label="Administration">
          {groups.map((g) => (
            <div key={g.title} style={{ display: 'contents' }}>
              <p className="adm-nav-group">{g.title}</p>
              {g.links.map((l) => (
                <Link key={l.href} href={l.href} aria-current={current(l.href)}>
                  {l.label}
                  {l.count ? <span className="adm-count">{l.count}</span> : null}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="adm-side-foot">
          <a href="/" target="_blank" rel="noopener">
            Voir le site ↗
          </a>
          <Link href="/admin/compte">Mon compte ({username})</Link>
          <form action={logout}>
            <button type="submit">Se déconnecter</button>
          </form>
        </div>
      </aside>
      <main className="adm-main">{children}</main>
    </div>
  )
}
