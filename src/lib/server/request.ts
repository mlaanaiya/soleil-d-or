import 'server-only'
import { headers } from 'next/headers'

/** Best-effort client IP (behind a reverse proxy that sets X-Forwarded-For / X-Real-IP). */
export async function clientIp(): Promise<string> {
  const h = await headers()
  const forwarded = h.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || h.get('x-real-ip') || 'unknown'
}
