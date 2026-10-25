'use server'

import { z } from 'zod'
import { BookingError, createOrder, createReservation } from '@/lib/server/bookings'
import { clientIp } from '@/lib/server/request'
import { rateLimit } from '@/lib/server/security'
import { orderInputSchema, reservationInputSchema } from '@/lib/schemas'

export type BookingResult = { ok: true; url: string } | { ok: false; error: string; fields?: Record<string, string> }

function fieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    fields[key] ??= issue.message
  }
  return fields
}

export async function placeOrder(input: unknown, honeypot: string): Promise<BookingResult> {
  if (honeypot) return { ok: false, error: 'Envoi refusé.' }
  if (!rateLimit(`order:${await clientIp()}`, 6, 10 * 60_000)) {
    return { ok: false, error: 'Trop de tentatives. Patientez quelques minutes ou appelez le restaurant.' }
  }
  const parsed = orderInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Vérifiez les champs indiqués.', fields: fieldErrors(parsed.error) }
  try {
    const { ref, token } = createOrder(parsed.data)
    return { ok: true, url: `/commander/suivi/${ref}?t=${token}` }
  } catch (error) {
    if (error instanceof BookingError) return { ok: false, error: error.message }
    console.error('[commande]', error)
    return { ok: false, error: 'Une erreur est survenue. Réessayez dans un instant.' }
  }
}

export async function placeReservation(input: unknown, honeypot: string): Promise<BookingResult> {
  if (honeypot) return { ok: false, error: 'Envoi refusé.' }
  if (!rateLimit(`reservation:${await clientIp()}`, 5, 10 * 60_000)) {
    return { ok: false, error: 'Trop de tentatives. Patientez quelques minutes ou appelez le restaurant.' }
  }
  const parsed = reservationInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Vérifiez les champs indiqués.', fields: fieldErrors(parsed.error) }
  try {
    const { ref, token } = createReservation(parsed.data)
    return { ok: true, url: `/reserver/suivi/${ref}?t=${token}` }
  } catch (error) {
    if (error instanceof BookingError) return { ok: false, error: error.message }
    console.error('[réservation]', error)
    return { ok: false, error: 'Une erreur est survenue. Réessayez dans un instant.' }
  }
}
