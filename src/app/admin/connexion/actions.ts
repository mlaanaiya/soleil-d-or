'use server'

import { redirect } from 'next/navigation'
import { startSession } from '@/lib/server/auth'
import { clientIp } from '@/lib/server/request'
import { clearRateLimit, findUserByCredentials, rateLimit } from '@/lib/server/security'

export type LoginState = { error: string | null }

/** Only same-site admin paths are accepted as a post-login destination. */
function safeNext(raw: FormDataEntryValue | null): string {
  const value = typeof raw === 'string' ? raw : ''
  return /^\/admin(?:[/?#]|$)/.test(value) && !value.startsWith('//') ? value : '/admin'
}

export async function login(_: LoginState, form: FormData): Promise<LoginState> {
  const username = String(form.get('username') ?? '').trim().slice(0, 80)
  const password = String(form.get('password') ?? '').slice(0, 200)
  const ip = await clientIp()
  const key = `login:${ip}:${username.toLowerCase()}`

  if (!rateLimit(key, 5, 15 * 60_000) || !rateLimit(`login-ip:${ip}`, 30, 15 * 60_000)) {
    return { error: 'Trop de tentatives. Réessayez dans 15 minutes.' }
  }
  if (!username || !password) return { error: 'Identifiant et mot de passe requis.' }

  const user = findUserByCredentials(username, password)
  if (!user) return { error: 'Identifiant ou mot de passe incorrect.' }

  clearRateLimit(key)
  await startSession(user.id)
  redirect(safeNext(form.get('suite')))
}
