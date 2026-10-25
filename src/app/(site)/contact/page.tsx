import type { Metadata } from 'next'
import { MapFacade } from '@/components/contact/MapFacade'
import styles from '@/components/contact/Contact.module.css'
import { JsonLd } from '@/components/seo/JsonLd'
import { PageHero } from '@/components/site/PageHero'
import { addDays, dayOf, exceptionFor, formatTimeFr, zonedNow } from '@/lib/hours'
import { telHref } from '@/lib/format'
import { getMenu } from '@/lib/server/catalog'
import { loadSite } from '@/lib/server/public'
import { restaurantJsonLd } from '@/lib/server/structured'
import { DAYS, DAY_LABELS, type Slot } from '@/lib/schemas'

export async function generateMetadata(): Promise<Metadata> {
  const site = await loadSite()
  const where = site.restaurant.city ? ` à ${site.restaurant.city}` : ''
  return {
    title: `Contact & accès — ${site.restaurant.name}${where}`,
    description: `Adresse, horaires, itinéraire et téléphone de ${site.restaurant.name}${where}.`,
    alternates: { canonical: '/contact' },
  }
}

const slotsText = (slots: Slot[]) =>
  slots.length === 0 ? 'Fermé' : slots.map((s) => `${formatTimeFr(s.open)} – ${formatTimeFr(s.close)}`).join(' · ')

export default async function ContactPage() {
  const site = await loadSite()
  const { restaurant, hours, services } = site
  const today = zonedNow().date
  const todayKey = dayOf(today)
  const upcoming = hours.exceptions
    .filter((e) => e.date >= today && e.date <= addDays(today, 30))
    .sort((a, b) => a.date.localeCompare(b.date))
  const serviceChips = [
    services.dineIn && 'Sur place',
    services.takeaway && 'À emporter',
    services.delivery && 'Livraison',
    services.ordering.enabled && 'Commande en ligne',
    services.reservations.enabled && 'Réservation en ligne',
  ].filter(Boolean) as string[]
  const todayException = exceptionFor(hours, today)

  return (
    <>
      <JsonLd data={restaurantJsonLd(site, getMenu())} />
      <PageHero eyebrow="Infos pratiques" title="Contact" accent="& accès" intro={site.content.contactIntro}>
        {site.status.state !== 'unknown' && (
          <p className={styles.statusPill}>
            <span className="status-dot" data-state={site.status.state} /> {site.statusLabel}
          </p>
        )}
      </PageHero>

      <section className={`container ${styles.grid}`}>
        <div className={styles.block}>
          <h2 className="eyebrow">Adresse</h2>
          {site.address ? (
            <address className={styles.address}>
              <span>{restaurant.street}</span>
              <span>{[restaurant.postalCode, restaurant.city].filter(Boolean).join(' ')}</span>
            </address>
          ) : (
            <p className={styles.pending}>L’adresse sera publiée ici très prochainement.</p>
          )}
          {site.directions && (
            <div className={styles.routes}>
              <a href={site.directions.google} className="btn" target="_blank" rel="noopener noreferrer">
                Itinéraire Google Maps
                <span className="btn-dot" aria-hidden="true" />
              </a>
              <a href={site.directions.apple} className="btn btn--ghost" target="_blank" rel="noopener noreferrer">
                Plans (Apple)
              </a>
              {site.directions.waze && (
                <a href={site.directions.waze} className="btn btn--ghost" target="_blank" rel="noopener noreferrer">
                  Waze
                </a>
              )}
            </div>
          )}

          <div className={styles.contactLines}>
            {restaurant.phone ? (
              <a href={telHref(restaurant.phone)} className={styles.bigLink}>
                <span className="eyebrow">Téléphone</span>
                {restaurant.phone}
              </a>
            ) : null}
            {restaurant.email ? (
              <a href={`mailto:${restaurant.email}`} className={styles.bigLink}>
                <span className="eyebrow">E-mail</span>
                {restaurant.email}
              </a>
            ) : null}
            {!restaurant.phone && !restaurant.email && (
              <p className="muted">Les coordonnées téléphoniques seront publiées très prochainement.</p>
            )}
          </div>

          {serviceChips.length > 0 && (
            <ul className={styles.chips} aria-label="Services">
              {serviceChips.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}

          {site.socials.length > 0 && (
            <ul className={styles.socials} aria-label="Réseaux sociaux">
              {site.socials.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="link-underline">
                    {s.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.hoursCard}>
          <h2 className="eyebrow">Horaires d’ouverture</h2>
          {site.hasHours ? (
            <dl className={styles.week}>
              {DAYS.map((d) => (
                <div key={d} className={styles.day} data-today={d === todayKey}>
                  <dt>
                    {DAY_LABELS[d]}
                    {d === todayKey && <span className={styles.todayTag}>Aujourd’hui</span>}
                  </dt>
                  <dd>{d === todayKey && todayException ? slotsText(todayException.slots) : slotsText(hours.week[d])}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className={styles.pending}>Les horaires d’ouverture seront publiés ici très prochainement.</p>
          )}
          {upcoming.length > 0 && (
            <div className={styles.exceptions}>
              <h3 className="eyebrow">Horaires exceptionnels</h3>
              <ul>
                {upcoming.map((e) => (
                  <li key={e.date}>
                    <span>
                      {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
                        new Date(`${e.date}T12:00:00Z`),
                      )}
                      {e.label && ` — ${e.label}`}
                    </span>
                    <strong>{slotsText(e.slots)}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {hours.note && <p className={styles.note}>{hours.note}</p>}
        </div>
      </section>

      <section className={`container ${styles.mapSection}`} aria-label="Plan d’accès">
        {restaurant.lat !== null && restaurant.lng !== null ? (
          <MapFacade lat={restaurant.lat} lng={restaurant.lng} label={site.address || restaurant.name} />
        ) : (
          <div className={styles.mapEmpty}>
            <span className={styles.mapPin} aria-hidden="true" />
            <p>Le plan d’accès apparaîtra ici dès que la position du restaurant sera renseignée.</p>
          </div>
        )}
      </section>
    </>
  )
}
