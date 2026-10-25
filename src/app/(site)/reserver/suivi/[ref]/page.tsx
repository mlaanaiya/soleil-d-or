import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AutoRefresh } from '@/components/order/AutoRefresh'
import styles from '@/components/order/Booking.module.css'
import { PageHero } from '@/components/site/PageHero'
import { telHref } from '@/lib/format'
import { formatTimeFr } from '@/lib/hours'
import { getReservationForCustomer } from '@/lib/server/bookings'
import { loadSite } from '@/lib/server/public'
import { RESERVATION_STATUS_LABELS } from '@/lib/schemas'

export const metadata: Metadata = { title: 'Suivi de réservation', robots: { index: false, follow: false } }

export default async function ReservationTracking(props: PageProps<'/reserver/suivi/[ref]'>) {
  const { ref } = await props.params
  const { t } = await props.searchParams
  const site = await loadSite()
  const resa = typeof t === 'string' ? await getReservationForCustomer(ref, t) : null
  if (!resa) notFound()
  const final = resa.status !== 'pending'

  return (
    <>
      <PageHero
        eyebrow="Demande envoyée"
        title="Merci !"
        accent={resa.status === 'confirmed' ? 'à très vite' : 'c’est noté'}
        intro="Conservez cette page : le statut de votre demande s’y affiche dès que le restaurant y répond."
      />
      <div className={`container ${styles.track}`}>
        <AutoRefresh seconds={final ? 0 : 30} />
        <div>
          <p className="eyebrow">Référence</p>
          <p className={styles.ref}>{resa.ref}</p>
        </div>
        <p
          className={resa.status === 'declined' || resa.status === 'cancelled' ? styles.error : styles.closed}
          role="status"
        >
          {RESERVATION_STATUS_LABELS[resa.status]}
          {(resa.status === 'declined' || resa.status === 'cancelled') && site.restaurant.phone && (
            <>
              {' '}
              — contactez-nous au <a href={telHref(site.restaurant.phone)}>{site.restaurant.phone}</a>.
            </>
          )}
        </p>
        <section className={styles.recap}>
          <dl>
            <div>
              <dt>Date</dt>
              <dd>
                {new Intl.DateTimeFormat('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  timeZone: 'UTC',
                }).format(new Date(`${resa.date}T12:00:00Z`))}
              </dd>
            </div>
            <div>
              <dt>Heure</dt>
              <dd>{formatTimeFr(resa.time)}</dd>
            </div>
            <div>
              <dt>Convives</dt>
              <dd>{resa.partySize}</dd>
            </div>
            <div>
              <dt>Nom</dt>
              <dd>{resa.name}</dd>
            </div>
          </dl>
        </section>
      </div>
    </>
  )
}
