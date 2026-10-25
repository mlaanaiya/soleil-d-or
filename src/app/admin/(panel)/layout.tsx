import { AdminShell } from '@/components/admin/AdminShell'
import { requireUser } from '@/lib/server/auth'
import { pendingCounts } from '@/lib/server/bookings'
import { getSetting } from '@/lib/server/settings'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const services = getSetting('services')
  const counts = pendingCounts()
  return (
    <AdminShell
      username={user.username}
      counts={counts}
      showOrders={services.ordering.enabled || counts.orders > 0}
      showReservations={services.reservations.enabled || counts.reservations > 0}
    >
      {children}
    </AdminShell>
  )
}
