import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ReservationForm, type ReservableDay } from '@/components/order/ReservationForm'
import { PageHero } from '@/components/site/PageHero'
import { addDays, reservationSlots, zonedNow } from '@/lib/hours'
import { loadSite } from '@/lib/server/public'

export async function generateMetadata(): Promise<Metadata> {
  const site = await loadSite()
  return {
    title: `Réserver une table — ${site.restaurant.name}`,
    description: `Réservez votre table chez ${site.restaurant.name}.`,
    alternates: { canonical: '/reserver' },
  }
}

export default async function ReserverPage() {
  const site = await loadSite()
  const { reservations } = site.services
  if (!reservations.enabled) notFound()

  const now = new Date()
  const today = zonedNow(now).date
  const dayFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
  const weekdayFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', timeZone: 'UTC' })
  const days: ReservableDay[] = Array.from({ length: Math.min(reservations.maxDaysAhead, 30) + 1 }, (_, i) => {
    const date = addDays(today, i)
    const at = new Date(`${date}T12:00:00Z`)
    return {
      date,
      label: dayFmt.format(at),
      short: i === 0 ? 'Auj.' : i === 1 ? 'Dem.' : weekdayFmt.format(at),
      slots: reservationSlots(site.hours, date, now, reservations.leadMinutes, reservations.slotMinutes),
    }
  })

  return (
    <>
      <PageHero eyebrow="Réservation" title="Réserver" accent="une table" intro="Choisissez une date, un horaire et le nombre de convives. Le restaurant confirme ensuite votre demande." />
      <div className="container">
        <ReservationForm days={days} maxParty={reservations.maxParty} note={reservations.note} />
      </div>
    </>
  )
}
