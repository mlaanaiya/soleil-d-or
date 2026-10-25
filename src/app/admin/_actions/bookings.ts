'use server'

import { runAdmin, type ActionState } from '@/lib/server/admin-action'
import { purgeBookings, setOrderStatus, setReservationStatus } from '@/lib/server/bookings'
import { ORDER_STATUSES, RESERVATION_STATUSES, type OrderStatus, type ReservationStatus } from '@/lib/schemas'

export async function updateOrderStatus(id: number, status: OrderStatus): Promise<ActionState> {
  return runAdmin(() => {
    if (!ORDER_STATUSES.includes(status)) throw new Error('Statut invalide')
    setOrderStatus(id, status)
  }, 'Commande mise à jour.')
}

export async function updateReservationStatus(id: number, status: ReservationStatus): Promise<ActionState> {
  return runAdmin(() => {
    if (!RESERVATION_STATUSES.includes(status)) throw new Error('Statut invalide')
    setReservationStatus(id, status)
  }, 'Réservation mise à jour.')
}

export async function purgeOld(days: number): Promise<ActionState> {
  let removed = 0
  const result = await runAdmin(() => {
    removed = purgeBookings(Math.max(7, Math.min(3650, Math.round(days))))
  }, '')
  return result.ok ? { ...result, message: `${removed} élément(s) supprimé(s).` } : result
}
