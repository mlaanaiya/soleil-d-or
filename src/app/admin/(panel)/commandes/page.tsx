import type { Metadata } from 'next'
import Link from 'next/link'
import { OrdersBoard, type AdminOrder } from '@/components/admin/OrdersBoard'
import { PurgeButton } from '@/components/admin/PurgeButton'
import { formatPrice } from '@/lib/format'
import { listOrders, type Order } from '@/lib/server/bookings'
import { getSetting } from '@/lib/server/settings'

export const metadata: Metadata = { title: 'Commandes' }

const dateTime = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })

function toAdmin(o: Order): AdminOrder {
  const [date, time] = o.pickupAt.split('T')
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date())
  return {
    id: o.id,
    ref: o.ref,
    customerName: o.customerName,
    phone: o.phone,
    pickupLabel: date === today ? `à ${time}` : `le ${date} à ${time}`,
    items: o.items.map((i) => ({ name: i.name, label: i.label, quantity: i.quantity, total: formatPrice(i.cents * i.quantity) })),
    total: formatPrice(o.totalCents),
    note: o.note,
    status: o.status,
    createdLabel: dateTime.format(new Date(`${o.createdAt.replace(' ', 'T')}Z`)),
  }
}

export default async function OrdersAdmin(props: PageProps<'/admin/commandes'>) {
  const { vue } = await props.searchParams
  const archive = vue === 'archives'
  const enabled = getSetting('services').ordering.enabled
  const orders = listOrders(archive ? 'archive' : 'active').map(toAdmin)
  return (
    <>
      <header className="adm-page-head">
        <div>
          <h1 className="adm-title">Commandes</h1>
          <p className="adm-sub">
            {enabled ? 'Commandes à retirer, de la plus proche à la plus lointaine.' : 'La commande en ligne est désactivée (Informations & services).'}
          </p>
        </div>
      </header>
      <nav className="adm-tabs" aria-label="Vue">
        <Link href="/admin/commandes" aria-current={!archive ? 'page' : undefined}>
          En cours
        </Link>
        <Link href="/admin/commandes?vue=archives" aria-current={archive ? 'page' : undefined}>
          Archives
        </Link>
      </nav>
      <OrdersBoard orders={orders} live={!archive} />
      {archive && <PurgeButton />}
    </>
  )
}
