import type { Metadata } from 'next'
import Link from 'next/link'
import { PurgeButton } from '@/components/admin/PurgeButton'
import { ReservationsTable } from '@/components/admin/ReservationsTable'
import { formatTimeFr, zonedNow } from '@/lib/hours'
import { listReservations } from '@/lib/server/bookings'
import { getSetting } from '@/lib/server/settings'

export const metadata: Metadata = { title: 'Réservations' }

const dayFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })

export default async function ReservationsAdmin(props: PageProps<'/admin/reservations'>) {
  const { vue } = await props.searchParams
  const past = vue === 'passees'
  const enabled = (await getSetting('services')).reservations.enabled
  const rows = (await listReservations(past ? 'past' : 'upcoming', zonedNow().date)).map((r) => ({
    id: r.id,
    ref: r.ref,
    name: r.name,
    phone: r.phone,
    email: r.email,
    dateLabel: dayFmt.format(new Date(`${r.date}T12:00:00Z`)),
    time: formatTimeFr(r.time),
    partySize: r.partySize,
    note: r.note,
    status: r.status,
  }))
  return (
    <>
      <header className="adm-page-head">
        <div>
          <h1 className="adm-title">Réservations</h1>
          <p className="adm-sub">
            {enabled
              ? 'Confirmez ou refusez les demandes : le client voit la réponse sur sa page de suivi.'
              : 'La réservation en ligne est désactivée (Informations & services).'}
          </p>
        </div>
      </header>
      <nav className="adm-tabs" aria-label="Vue">
        <Link href="/admin/reservations" aria-current={!past ? 'page' : undefined}>
          À venir
        </Link>
        <Link href="/admin/reservations?vue=passees" aria-current={past ? 'page' : undefined}>
          Passées
        </Link>
      </nav>
      <ReservationsTable rows={rows} live={!past} />
      {past && <PurgeButton />}
    </>
  )
}
