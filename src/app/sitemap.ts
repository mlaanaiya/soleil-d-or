import type { MetadataRoute } from 'next'
import { connection } from 'next/server'
import { listProducts } from '@/lib/server/catalog'
import { getSetting } from '@/lib/server/settings'
import { siteUrl } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection()
  const base = siteUrl()
  const services = getSetting('services')
  const pages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/carte`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/contact`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/restaurant`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/galerie`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/mentions-legales`, changeFrequency: 'yearly', priority: 0.1 },
  ]
  if (services.ordering.enabled || services.externalLinks.length > 0)
    pages.push({ url: `${base}/commander`, changeFrequency: 'monthly', priority: 0.7 })
  if (services.reservations.enabled) pages.push({ url: `${base}/reserver`, changeFrequency: 'monthly', priority: 0.7 })
  const products = listProducts({ publicOnly: true }).map((p) => ({
    url: `${base}/carte/${p.slug}`,
    lastModified: new Date(`${p.updatedAt.replace(' ', 'T')}Z`),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))
  return [...pages, ...products]
}
