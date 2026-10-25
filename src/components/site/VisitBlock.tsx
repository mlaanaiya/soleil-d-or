import Link from 'next/link'
import { formatSlots, groupedWeek } from '@/lib/hours'
import { telHref } from '@/lib/format'
import type { SiteContext } from '@/lib/server/public'
import styles from './VisitBlock.module.css'

/** Practical information block, shared by the home page and the restaurant page. */
export function VisitBlock({ site, index }: { site: SiteContext; index?: string }) {
  const { restaurant, hours } = site
  return (
    <section className={`section ${styles.visit}`} aria-labelledby="visit-title">
      <div className={`container ${styles.grid}`}>
        <div className={styles.main}>
          <p className="eyebrow">
            {index && <span className="sun-text">{index} </span>}
            Infos pratiques
          </p>
          <h2 id="visit-title" className={styles.title}>
            Nous <span className="serif sun-text">trouver</span>
          </h2>
          {site.status.state !== 'unknown' && (
            <p className={styles.status}>
              <span className="status-dot" data-state={site.status.state} />
              {site.statusLabel}
            </p>
          )}
          {site.address ? (
            <address className={styles.address}>
              <span>{restaurant.street}</span>
              <span>{[restaurant.postalCode, restaurant.city].filter(Boolean).join(' ')}</span>
            </address>
          ) : (
            <p className={styles.pending}>L’adresse sera publiée ici très prochainement.</p>
          )}
          <div className={styles.actions}>
            {site.directions && (
              <a href={site.directions.google} className="btn" target="_blank" rel="noopener noreferrer">
                Itinéraire
                <span className="btn-dot" aria-hidden="true" />
              </a>
            )}
            {restaurant.phone && (
              <a href={telHref(restaurant.phone)} className="btn btn--ghost">
                {restaurant.phone}
              </a>
            )}
            <Link href="/contact" className="btn btn--ghost">
              Contact & accès
            </Link>
          </div>
        </div>

        <div className={styles.hours}>
          <p className="eyebrow">Horaires</p>
          {site.hasHours ? (
            <dl>
              {groupedWeek(hours).map((g) => (
                <div key={g.days} className={styles.row}>
                  <dt>{g.days}</dt>
                  <dd>{formatSlots(g.slots)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className={styles.pending}>Les horaires d’ouverture seront publiés ici très prochainement.</p>
          )}
          {hours.note && <p className={styles.note}>{hours.note}</p>}
        </div>
      </div>
    </section>
  )
}
