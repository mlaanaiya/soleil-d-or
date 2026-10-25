import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AutoRefresh } from '@/components/order/AutoRefresh'
import styles from '@/components/order/Booking.module.css'
import { PageHero } from '@/components/site/PageHero'
import { formatPrice, telHref } from '@/lib/format'
import { getOrderForCustomer } from '@/lib/server/bookings'
import { loadSite } from '@/lib/server/public'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/lib/schemas'

export const metadata: Metadata = { title: 'Suivi de commande', robots: { index: false, follow: false } }

const FLOW: OrderStatus[] = ['new', 'accepted', 'ready', 'done']

export default async function OrderTracking(props: PageProps<'/commander/suivi/[ref]'>) {
  const { ref } = await props.params
  const { t } = await props.searchParams
  const site = await loadSite()
  const order = typeof t === 'string' ? await getOrderForCustomer(ref, t) : null
  if (!order) notFound()
  const index = FLOW.indexOf(order.status)
  const [date, time] = order.pickupAt.split('T')

  return (
    <>
      <PageHero
        eyebrow="Commande envoyée"
        title="Merci !"
        accent="à tout à l’heure"
        intro="Conservez cette page : elle se met à jour toute seule."
      />
      <div className={`container ${styles.track}`}>
        <AutoRefresh seconds={order.status === 'done' || order.status === 'cancelled' ? 0 : 20} />
        <div>
          <p className="eyebrow">Référence</p>
          <p className={styles.ref}>{order.ref}</p>
        </div>
        {order.status === 'cancelled' ? (
          <p className={styles.error}>
            Cette commande a été annulée par le restaurant.
            {site.restaurant.phone && (
              <>
                {' '}
                Contactez-nous au <a href={telHref(site.restaurant.phone)}>{site.restaurant.phone}</a>.
              </>
            )}
          </p>
        ) : (
          <ol className={styles.steps}>
            {FLOW.map((s, i) => (
              <li key={s} className={styles.step} data-state={i < index ? 'done' : i === index ? 'current' : 'todo'}>
                <span className={styles.stepDot} aria-hidden="true" />
                <span>
                  {ORDER_STATUS_LABELS[s]}
                  {i === index && <span className="visually-hidden"> (étape actuelle)</span>}
                </span>
              </li>
            ))}
          </ol>
        )}
        <section className={styles.recap}>
          <dl>
            <div>
              <dt>Retrait</dt>
              <dd>
                {new Intl.DateTimeFormat('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  timeZone: 'UTC',
                }).format(new Date(`${date}T12:00:00Z`))}{' '}
                à {time}
              </dd>
            </div>
            <div>
              <dt>Nom</dt>
              <dd>{order.customerName}</dd>
            </div>
            {order.items.map((item, i) => (
              <div key={i}>
                <dt>
                  {item.quantity} × {item.name}
                  {item.label && ` (${item.label})`}
                </dt>
                <dd>{formatPrice(item.cents * item.quantity)}</dd>
              </div>
            ))}
            <div>
              <dt>Total à régler au retrait</dt>
              <dd className="sun-text">{formatPrice(order.totalCents)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </>
  )
}
