import type { MetadataRoute } from 'next'
import { connection } from 'next/server'
import { siteUrl } from '@/lib/site'

/** Rendered per request so SITE_URL is read at runtime, not frozen at build time. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection()
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/commander/suivi/', '/reserver/suivi/'] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  }
}
