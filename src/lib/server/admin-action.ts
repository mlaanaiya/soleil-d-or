import 'server-only'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { assertAdmin, UnauthorizedError } from './auth'
import { BookingError } from './bookings'
import { CatalogError } from './catalog'
import { MediaError } from './media'
import type { ActionState } from '../action-state'

export type { ActionState }

const FIELD_LABELS: Record<string, string> = {
  name: 'Nom',
  slug: 'Adresse (slug)',
  email: 'E-mail',
  phone: 'Téléphone',
}

function zodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form'
    errors[key] ??= issue.message
  }
  return errors
}

/**
 * Wraps every admin mutation: checks the session, maps known errors to readable messages
 * and refreshes the public pages so changes are visible immediately.
 */
export async function runAdmin(fn: () => void | Promise<void>, success: string): Promise<ActionState> {
  try {
    await assertAdmin()
    await fn()
    revalidatePath('/', 'layout')
    return { ok: true, message: success, at: Date.now() }
  } catch (error) {
    if (error instanceof UnauthorizedError) return { ok: false, message: error.message, at: Date.now() }
    if (error instanceof z.ZodError) {
      const errors = zodErrors(error)
      const first = Object.entries(errors)[0]
      const label = first ? FIELD_LABELS[first[0].split('.').at(-1)!] : undefined
      return {
        ok: false,
        message: first ? `${label ? `${label} : ` : ''}${first[1]}` : 'Données invalides.',
        errors,
        at: Date.now(),
      }
    }
    if (error instanceof CatalogError || error instanceof MediaError || error instanceof BookingError) {
      return { ok: false, message: error.message, at: Date.now() }
    }
    console.error('[admin]', error)
    return { ok: false, message: 'Une erreur inattendue est survenue.', at: Date.now() }
  }
}

/* --------------------------- FormData helpers --------------------------- */

export const str = (form: FormData, key: string) => String(form.get(key) ?? '').trim()
export const bool = (form: FormData, key: string) => form.get(key) === 'on' || form.get(key) === 'true'
export const nullableId = (form: FormData, key: string) => str(form, key) || null
export const int = (form: FormData, key: string, fallback = 0) => {
  const n = Number.parseInt(str(form, key), 10)
  return Number.isFinite(n) ? n : fallback
}
export const num = (form: FormData, key: string): number | null => {
  const raw = str(form, key).replace(',', '.')
  if (raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}
