import type { Metadata } from 'next'
import Link from 'next/link'
import { hasHours, describeStatus, getOpenStatus } from '@/lib/hours'
import { pendingCounts } from '@/lib/server/bookings'
import { listCategories, listProducts } from '@/lib/server/catalog'
import { getSiteData } from '@/lib/server/settings'

export const metadata: Metadata = { title: 'Tableau de bord' }

export default async function Dashboard() {
  const { restaurant, hours, services, content } = getSiteData()
  const products = listProducts()
  const categories = listCategories()
  const counts = pendingCounts()
  const withoutPrice = products.filter((p) => p.visible && p.prices.length === 0).length
  const unavailable = products.filter((p) => !p.available).length
  const status = getOpenStatus(hours)

  const checklist = [
    {
      done: Boolean(restaurant.street && restaurant.city),
      label: 'Adresse du restaurant',
      href: '/admin/informations',
    },
    {
      done: restaurant.lat !== null && restaurant.lng !== null,
      label: 'Position sur la carte (plan d’accès, itinéraires)',
      href: '/admin/informations',
    },
    { done: Boolean(restaurant.phone), label: 'Numéro de téléphone', href: '/admin/informations' },
    { done: hasHours(hours), label: 'Horaires d’ouverture', href: '/admin/horaires' },
    {
      done: withoutPrice === 0,
      label: 'Prix des produits',
      href: '/admin/produits?sansprix=1',
      hint: withoutPrice > 0 ? `${withoutPrice} sans prix` : undefined,
    },
    {
      done: Object.values(restaurant.socials).some(Boolean),
      label: 'Réseaux sociaux (facultatif)',
      href: '/admin/informations',
    },
    { done: Boolean(content.legalNotice), label: 'Mentions légales (obligatoires)', href: '/admin/contenus#legal' },
    {
      done: services.dineIn || services.takeaway || services.delivery,
      label: 'Services proposés (sur place, à emporter…)',
      href: '/admin/informations#services',
    },
  ]
  const remaining = checklist.filter((c) => !c.done).length

  return (
    <>
      <header className="adm-page-head">
        <div>
          <h1 className="adm-title">Tableau de bord</h1>
          <p className="adm-sub">
            {status.state === 'unknown'
              ? 'Renseignez vos horaires pour afficher l’état d’ouverture sur le site.'
              : `Sur le site : ${describeStatus(status)}.`}
          </p>
        </div>
        <a href="/" target="_blank" rel="noopener" className="adm-btn">
          Voir le site ↗
        </a>
      </header>

      <div className="adm-stats">
        <Link className="adm-stat" href="/admin/produits">
          <strong>{products.length}</strong>
          <span>produits · {categories.length} catégories</span>
        </Link>
        <Link className="adm-stat" href="/admin/produits?sansprix=1" data-tone={withoutPrice > 0 ? 'warn' : undefined}>
          <strong>{withoutPrice}</strong>
          <span>produits sans prix</span>
        </Link>
        <Link className="adm-stat" href="/admin/produits" data-tone={unavailable > 0 ? 'warn' : undefined}>
          <strong>{unavailable}</strong>
          <span>produits indisponibles</span>
        </Link>
        {services.ordering.enabled && (
          <Link className="adm-stat" href="/admin/commandes" data-tone={counts.orders > 0 ? 'warn' : undefined}>
            <strong>{counts.orders}</strong>
            <span>nouvelles commandes</span>
          </Link>
        )}
        {services.reservations.enabled && (
          <Link
            className="adm-stat"
            href="/admin/reservations"
            data-tone={counts.reservations > 0 ? 'warn' : undefined}
          >
            <strong>{counts.reservations}</strong>
            <span>réservations à confirmer</span>
          </Link>
        )}
      </div>

      <section className="adm-card">
        <h2>
          Mise en route{' '}
          {remaining > 0
            ? `— ${remaining} étape${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}`
            : '— tout est prêt ✓'}
        </h2>
        <p className="adm-card-sub">
          Tant qu’une information manque, le site affiche un message neutre à sa place, jamais une donnée inventée.
        </p>
        <div className="adm-checklist">
          {checklist.map((c) => (
            <Link key={c.label} href={c.href} className="adm-check" data-done={c.done}>
              <span>{c.label}</span>
              {!c.done && <em>{c.hint ?? 'À compléter →'}</em>}
            </Link>
          ))}
        </div>
      </section>

      <section className="adm-card">
        <h2>Raccourcis</h2>
        <p className="adm-card-sub">Les modifications sont visibles sur le site dès l’enregistrement.</p>
        <div className="adm-row">
          <Link href="/admin/produits" className="adm-btn adm-btn--primary">
            Modifier les prix
          </Link>
          <Link href="/admin/produits/nouveau" className="adm-btn">
            Ajouter un produit
          </Link>
          <Link href="/admin/photos" className="adm-btn">
            Ajouter des photos
          </Link>
          <Link href="/admin/horaires" className="adm-btn">
            Horaires
          </Link>
        </div>
      </section>
    </>
  )
}
