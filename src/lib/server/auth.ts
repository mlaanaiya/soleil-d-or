import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { SESSION_COOKIE, SESSION_TTL_MS, createSession, destroySession, userForSession, type User } from './security'

export const currentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  return userForSession(token)
})

/** For admin pages: redirects to the login screen when there is no valid session. */
export async function requireUser(): Promise<User> {
  const user = await currentUser()
  if (!user) redirect('/admin/connexion')
  return user
}

export class UnauthorizedError extends Error {}

/** For admin server actions and route handlers: throws when there is no valid session. */
export async function assertAdmin(): Promise<User> {
  const user = await currentUser()
  if (!user) throw new UnauthorizedError('Session expirée, reconnectez-vous.')
  return user
}

export async function startSession(userId: number) {
  const { token, expiresAt } = await createSession(userId)
  ;(await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(expiresAt),
  })
}

export async function endSession() {
  const jar = await cookies()
  await destroySession(jar.get(SESSION_COOKIE)?.value)
  jar.delete(SESSION_COOKIE)
}

export async function sessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value
}

export { SESSION_TTL_MS }
