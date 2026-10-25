import 'server-only'
import { connection } from 'next/server'
import { cache } from 'react'
import { describeStatus, getOpenStatus, hasHours } from '../hours'
import { fullAddress } from '../format'
import { getSiteData } from './settings'

export type Directions = { google: string; apple: string; waze: string | null }

function directionsFor(lat: number | null, lng: number | null, address: string): Directions | null {
  if (lat !== null && lng !== null) {
    const ll = `${lat},${lng}`
    return {
      google: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ll)}`,
      apple: `https://maps.apple.com/?daddr=${encodeURIComponent(ll)}`,
      waze: `https://waze.com/ul?ll=${encodeURIComponent(ll)}&navigate=yes`,
    }
  }
  if (!address) return null
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,
    apple: `https://maps.apple.com/?daddr=${encodeURIComponent(address)}`,
    waze: `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`,
  }
}

/** Everything the public chrome needs, computed once per request and always fresh from the database. */
export const loadSite = cache(async () => {
  await connection()
  const data = await getSiteData()
  const { restaurant, services, hours } = data
  const address = fullAddress(restaurant)
  const status = getOpenStatus(hours)
  return {
    ...data,
    address,
    status,
    statusLabel: describeStatus(status),
    hasHours: hasHours(hours),
    directions: directionsFor(restaurant.lat, restaurant.lng, address),
    canOrderOnline: services.ordering.enabled,
    canReserve: services.reservations.enabled,
    canOrder: services.ordering.enabled || services.externalLinks.length > 0,
    socials: Object.entries(restaurant.socials)
      .filter(([, url]) => url)
      .map(([network, url]) => ({ network, url, label: SOCIAL_LABELS[network] ?? network })),
  }
})
export type SiteContext = Awaited<ReturnType<typeof loadSite>>

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  snapchat: 'Snapchat',
  google: 'Google',
}
