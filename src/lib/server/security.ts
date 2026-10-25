import 'server-only'
import crypto from 'node:crypto'
import { one, query } from './db'

/* ---------------------------- Passwords ---------------------------- */

const SCRYPT = { N: 2 ** 15, r: 8, p: 1, keylen: 64, maxmem: 64 * 1024 * 1024 }

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(password, salt, SCRYPT.keylen, SCRYPT)
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64'), hash.toString('base64')].join('$')
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, n, r, p, salt, hash] = stored.split('$')
  if (scheme !== 'scrypt' || !salt || !hash) return false
  const expected = Buffer.from(hash, 'base64')
  const actual = crypto.scryptSync(password, Buffer.from(salt, 'base64'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: SCRYPT.maxmem,
  })
  return crypto.timingSafeEqual(expected, actual)
}

export function passwordProblem(password: string): string | null {
  if (password.length < 10) return 'Le mot de passe doit contenir au moins 10 caractères.'
  if (password.length > 200) return 'Mot de passe trop long.'
  return null
}

/* ----------------------------- Users ------------------------------- */

export type User = { id: number; username: string }

export async function findUserByCredentials(username: string, password: string): Promise<User | null> {
  const row = await one<{ id: number; username: string; password_hash: string }>(
    'SELECT id, username, password_hash FROM users WHERE lower(username) = lower($1)',
    [username.trim()],
  )
  // Hash anyway when the user is unknown so response time does not reveal valid usernames.
  if (!row) {
    verifyPassword(password, DUMMY_HASH)
    return null
  }
  return verifyPassword(password, row.password_hash) ? { id: row.id, username: row.username } : null
}
const DUMMY_HASH = hashPassword(crypto.randomBytes(16).toString('hex'))

export async function countUsers(): Promise<number> {
  return (await one<{ n: number }>('SELECT COUNT(*)::int AS n FROM users'))!.n
}

export async function upsertUser(username: string, password: string) {
  const problem = passwordProblem(password)
  if (problem) throw new Error(problem)
  await query(
    `INSERT INTO users (username, password_hash) VALUES ($1, $2)
     ON CONFLICT ((lower(username))) DO UPDATE SET password_hash = excluded.password_hash`,
    [username.trim(), hashPassword(password)],
  )
}

export async function changePassword(userId: number, current: string, next: string): Promise<string | null> {
  const row = await one<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = $1', [userId])
  if (!row || !verifyPassword(current, row.password_hash)) return 'Mot de passe actuel incorrect.'
  const problem = passwordProblem(next)
  if (problem) return problem
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashPassword(next), userId])
  return null
}

/* ---------------------------- Sessions ----------------------------- */

export const SESSION_COOKIE = 'sdo_session'
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7

const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex')

export async function createSession(userId: number): Promise<{ token: string; expiresAt: number }> {
  const token = crypto.randomBytes(32).toString('base64url')
  const expiresAt = Date.now() + SESSION_TTL_MS
  await query('DELETE FROM sessions WHERE expires_at < now()')
  await query('INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3::timestamptz)', [
    sha256(token),
    userId,
    new Date(expiresAt).toISOString(),
  ])
  return { token, expiresAt }
}

export async function userForSession(token: string | undefined): Promise<User | null> {
  if (!token || token.length > 100) return null
  const row = await one<{ id: number; username: string }>(
    `SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = $1 AND s.expires_at > now()`,
    [sha256(token)],
  )
  return row ? { id: row.id, username: row.username } : null
}

export async function destroySession(token: string | undefined) {
  if (token) await query('DELETE FROM sessions WHERE id = $1', [sha256(token)])
}

export async function destroyOtherSessions(userId: number, keepToken: string | undefined) {
  await query('DELETE FROM sessions WHERE user_id = $1 AND id <> $2', [userId, keepToken ? sha256(keepToken) : ''])
}

/* --------------------------- Rate limiting ------------------------- */

/**
 * Fixed-window limiter persisted in the database, atomic in a single statement.
 * Returns true when the action is allowed.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const row = await one<{ count: number }>(
    `INSERT INTO rate_limits (key, count, reset_at) VALUES ($1, 1, now() + make_interval(secs => $2::float8))
     ON CONFLICT (key) DO UPDATE SET
       count    = CASE WHEN rate_limits.reset_at < now() THEN 1 ELSE rate_limits.count + 1 END,
       reset_at = CASE WHEN rate_limits.reset_at < now() THEN excluded.reset_at ELSE rate_limits.reset_at END
     RETURNING count`,
    [key, windowMs / 1000],
  )
  return row!.count <= limit
}

export async function clearRateLimit(key: string) {
  await query('DELETE FROM rate_limits WHERE key = $1', [key])
}

/* ----------------------------- Tokens ------------------------------ */

const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function humanRef(length = 6): string {
  const bytes = crypto.randomBytes(length)
  return Array.from(bytes, (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join('')
}

export function secretToken(): string {
  return crypto.randomBytes(18).toString('base64url')
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb)
}
