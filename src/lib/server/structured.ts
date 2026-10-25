import 'server-only'
import { mediaUrl } from '@/components/ui/Picture'
import { siteUrl } from '../site'
import { DAYS, type Day } from '../schemas'
import type { CategoryWithProducts } from '../types'
import type { SiteContext } from './public'

const SCHEMA_DAYS: Record<Day, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

/** Schema.org menu built from the live catalogue; prices only when they are configured. */
export function menuJsonLd(menu: CategoryWithProducts[]) {
  const base = siteUrl()
  return {
    '@type': 'Menu',
    '@id': `${base}/carte#menu`,
    url: `${base}/carte`,
    inLanguage: 'fr',
    hasMenuSection: menu
      .filter((c) => c.products.length > 0)
      .map((c) => ({
        '@type': 'MenuSection',
        name: c.name,
        hasMenuItem: c.products.map((p) => ({
          '@type': 'MenuItem',
          name: p.name,
          url: `${base}/carte/${p.slug}`,
          ...(p.description ? { description: p.description } : {}),
          ...(p.photo ? { image: `${base}${mediaUrl(p.photo, 1200)}` } : {}),
          ...(p.prices.length > 0
            ? {
                offers: p.prices.map((x) => ({
                  '@type': 'Offer',
                  ...(x.label ? { name: x.label } : {}),
                  price: (x.cents / 100).toFixed(2),
                  priceCurrency: 'EUR',
                })),
              }
            : {}),
        })),
      })),
  }
}

/** Local business description: every field is optional and only emitted when filled in the admin. */
export function restaurantJsonLd(site: SiteContext, menu: CategoryWithProducts[]) {
  const base = siteUrl()
  const { restaurant, hours, services, content } = site
  const opening = DAYS.flatMap((d) =>
    hours.week[d].map((s) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: SCHEMA_DAYS[d], opens: s.open, closes: s.close })),
  )
  const special = hours.exceptions.flatMap((e) =>
    e.slots.length === 0
      ? [{ '@type': 'OpeningHoursSpecification', validFrom: e.date, validThrough: e.date, opens: '00:00', closes: '00:00' }]
      : e.slots.map((s) => ({ '@type': 'OpeningHoursSpecification', validFrom: e.date, validThrough: e.date, opens: s.open, closes: s.close })),
  )
  return {
    '@context': 'https://schema.org',
    '@type': 'FastFoodRestaurant',
    '@id': `${base}/#restaurant`,
    name: restaurant.name,
    url: `${base}/`,
    description: content.seoDescription,
    image: `${base}/opengraph-image`,
    logo: `${base}/icon.svg`,
    ...(restaurant.street || restaurant.city
      ? {
          address: {
            '@type': 'PostalAddress',
            ...(restaurant.street ? { streetAddress: restaurant.street } : {}),
            ...(restaurant.postalCode ? { postalCode: restaurant.postalCode } : {}),
            ...(restaurant.city ? { addressLocality: restaurant.city } : {}),
            addressCountry: 'FR',
          },
        }
      : {}),
    ...(restaurant.lat !== null && restaurant.lng !== null
      ? { geo: { '@type': 'GeoCoordinates', latitude: restaurant.lat, longitude: restaurant.lng } }
      : {}),
    ...(restaurant.phone ? { telephone: restaurant.phone } : {}),
    ...(restaurant.email ? { email: restaurant.email } : {}),
    ...(opening.length ? { openingHoursSpecification: opening } : {}),
    ...(special.length ? { specialOpeningHoursSpecification: special } : {}),
    ...(site.socials.length ? { sameAs: site.socials.map((s) => s.url) } : {}),
    ...(services.reservations.enabled ? { acceptsReservations: `${base}/reserver` } : {}),
    hasMenu: menuJsonLd(menu),
  }
}
