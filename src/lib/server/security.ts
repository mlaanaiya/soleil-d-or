import 'server-only'
import crypto from 'node:crypto'
import { db } from './db'

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

export function findUserByCredentials(username: string, password: string): User | null {
  const row = db().prepare('SELECT id, username, password_hash FROM users WHERE username = ?').get(username.trim()) as
    { id: number; username: string; password_hash: string } | undefined
  // Hash anyway when the user is unknown so response time does not reveal valid usernames.
  if (!row) {
    verifyPassword(password, DUMMY_HASH)
    return null
  }
  return verifyPassword(password, row.password_hash) ? { id: row.id, username: row.username } : null
}
const DUMMY_HASH = hashPassword(crypto.randomBytes(16).toString('hex'))

export function countUsers(): number {
  return (db().prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n
}

export function upsertUser(username: string, password: string) {
  const problem = passwordProblem(password)
  if (problem) throw new Error(problem)
  db()
    .prepare(
      `INSERT INTO users (username, password_hash) VALUES (?, ?)
       ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash`,
    )
    .run(username.trim(), hashPassword(password))
}

export function changePassword(userId: number, current: string, next: string): string | null {
  const row = db().prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as
    { password_hash: string } | undefined
  if (!row || !verifyPassword(current, row.password_hash)) return 'Mot de passe actuel incorrect.'
  const problem = passwordProblem(next)
  if (problem) return problem
  db().prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(next), userId)
  return null
}

/* ---------------------------- Sessions ----------------------------- */

export const SESSION_COOKIE = 'sdo_session'
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7

const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex')

export function createSession(userId: number): { token: string; expiresAt: number } {
  const token = crypto.randomBytes(32).toString('base64url')
  const expiresAt = Date.now() + SESSION_TTL_MS
  db().prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now())
  db().prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(sha256(token), userId, expiresAt)
  return { token, expiresAt }
}

export function userForSession(token: string | undefined): User | null {
  if (!token || token.length > 100) return null
  const row = db()
    .prepare(`SELECT u.id, u.username, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?`)
    .get(sha256(token)) as { id: number; username: string; expires_at: number } | undefined
  if (!row || row.expires_at < Date.now()) return null
  return { id: row.id, username: row.username }
}

export function destroySession(token: string | undefined) {
  if (token) db().prepare('DELETE FROM sessions WHERE id = ?').run(sha256(token))
}

export function destroyOtherSessions(userId: number, keepToken: string | undefined) {
  db()
    .prepare('DELETE FROM sessions WHERE user_id = ? AND id != ?')
    .run(userId, keepToken ? sha256(keepToken) : '')
}

/* --------------------------- Rate limiting ------------------------- */

/** Fixed-window limiter persisted in SQLite. Returns true when the action is allowed. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  return db().transaction(() => {
    const row = db().prepare('SELECT count, reset_at FROM rate_limits WHERE key = ?').get(key) as
      { count: number; reset_at: number } | undefined
    if (!row || row.reset_at < now) {
      db()
        .prepare('INSERT OR REPLACE INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)')
        .run(key, now + windowMs)
      return true
    }
    if (row.count >= limit) return false
    db().prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').run(key)
    return true
  })()
}

export function clearRateLimit(key: string) {
  db().prepare('DELETE FROM rate_limits WHERE key = ?').run(key)
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
