import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { OrderForm, type OrderableCategory } from '@/components/order/OrderForm'
import { PageHero } from '@/components/site/PageHero'
import { describeStatus, pickupSlots } from '@/lib/hours'
import { telHref } from '@/lib/format'
import { getMenu } from '@/lib/server/catalog'
import { loadSite } from '@/lib/server/public'
import styles from './commander.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const site = await loadSite()
  return {
    title: `Commander — ${site.restaurant.name}`,
    description: `Commandez chez ${site.restaurant.name}.`,
    alternates: { canonical: '/commander' },
  }
}

export default async function CommanderPage() {
  const site = await loadSite()
  if (!site.canOrder) notFound()
  const { services } = site

  let online: React.ReactNode = null
  if (services.ordering.enabled) {
    const categories: OrderableCategory[] = (await getMenu())
      .map((c) => ({
        slug: c.slug,
        name: c.name,
        products: c.products
          .filter((p) => p.available && p.prices.length > 0)
          .map((p) => ({ id: p.id, name: p.name, photo: p.photo, prices: p.prices })),
      }))
      .filter((c) => c.products.length > 0)
    const slots = pickupSlots(site.hours, new Date(), services.ordering.leadMinutes, services.ordering.slotMinutes)
    const closedMessage =
      slots.length > 0
        ? null
        : `La commande en ligne est possible pendant les heures d’ouverture. ${site.status.state === 'closed' ? describeStatus(site.status) + '.' : ''}`.trim()
    online =
      categories.length > 0 ? (
        <OrderForm categories={categories} slots={slots} note={services.ordering.note} closedMessage={closedMessage} />
      ) : (
        <p className={styles.notice}>Aucun produit n’est disponible à la commande pour le moment.</p>
      )
  }

  return (
    <>
      <PageHero
        eyebrow={services.ordering.enabled ? 'Click & collect' : 'Commander'}
        title="Commander"
        accent={services.ordering.enabled ? 'à emporter' : undefined}
        intro={
          services.ordering.enabled
            ? 'Composez votre commande, choisissez l’heure de retrait : elle vous attend au restaurant.'
            : 'Retrouvez nos produits sur les plateformes ci-dessous.'
        }
      />
      <div className="container">
        {services.externalLinks.length > 0 && (
          <section className={styles.partners} aria-label="Commander via nos partenaires">
            {services.externalLinks.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className={styles.partner}>
                <span className={styles.partnerName}>{l.label}</span>
                <span className={styles.partnerGo} aria-hidden="true">
                  ↗
                </span>
              </a>
            ))}
            {site.restaurant.phone && (
              <a href={telHref(site.restaurant.phone)} className={styles.partner}>
                <span className={styles.partnerName}>Par téléphone</span>
                <span className={styles.partnerMeta}>{site.restaurant.phone}</span>
              </a>
            )}
          </section>
        )}
        {online}
      </div>
    </>
  )
}
