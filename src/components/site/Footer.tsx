import Link from 'next/link'
import { formatSlots, groupedWeek } from '@/lib/hours'
import { telHref } from '@/lib/format'
import { NAV } from '@/lib/site'
import type { SiteContext } from '@/lib/server/public'
import { SunMark } from './Logo'
import { Sunset } from './Sunset'
import styles from './Footer.module.css'

export function Footer({ site }: { site: SiteContext }) {
  const { restaurant, hours } = site
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.col}>
          <p className="eyebrow">Navigation</p>
          <ul className={styles.list}>
            <li>
              <Link href="/">Accueil</Link>
            </li>
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href}>{n.label}</Link>
              </li>
            ))}
            {site.canOrder && (
              <li>
                <Link href="/commander">Commander</Link>
              </li>
            )}
            {site.canReserve && (
              <li>
                <Link href="/reserver">Réserver</Link>
              </li>
            )}
          </ul>
        </div>

        <div className={styles.col}>
          <p className="eyebrow">Nous trouver</p>
          {site.address ? (
            <address className={styles.address}>
              {restaurant.street && <span>{restaurant.street}</span>}
              <span>{[restaurant.postalCode, restaurant.city].filter(Boolean).join(' ')}</span>
            </address>
          ) : (
            <p className="muted">Adresse communiquée très prochainement.</p>
          )}
          <ul className={styles.list}>
            {restaurant.phone && (
              <li>
                <a href={telHref(restaurant.phone)}>{restaurant.phone}</a>
              </li>
            )}
            {restaurant.email && (
              <li>
                <a href={`mailto:${restaurant.email}`}>{restaurant.email}</a>
              </li>
            )}
            {site.directions && (
              <li>
                <a href={site.directions.google} target="_blank" rel="noopener noreferrer">
                  Itinéraire ↗
                </a>
              </li>
            )}
          </ul>
        </div>

        <div className={styles.col}>
          <p className="eyebrow">Horaires</p>
          {site.hasHours ? (
            <dl className={styles.hours}>
              {groupedWeek(hours).map((g) => (
                <div key={g.days}>
                  <dt>{g.days}</dt>
                  <dd>{formatSlots(g.slots)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="muted">Horaires communiqués très prochainement.</p>
          )}
        </div>

        {site.socials.length > 0 && (
          <div className={styles.col}>
            <p className="eyebrow">Suivre</p>
            <ul className={styles.list}>
              {site.socials.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Sunset name={restaurant.name} />

      <div className={`container ${styles.legal}`}>
        <span className={styles.legalBrand}>
          <SunMark size={16} /> © {year} {restaurant.name}
        </span>
        <Link href="/mentions-legales" className="link-underline">
          Mentions légales & confidentialité
        </Link>
      </div>
    </footer>
  )
}
