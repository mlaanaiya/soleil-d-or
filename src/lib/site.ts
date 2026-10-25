export function siteUrl(): string {
  const raw = process.env.SITE_URL || 'http://localhost:3000'
  return raw.replace(/\/+$/, '')
}

export const NAV = [
  { href: '/carte', label: 'La carte' },
  { href: '/restaurant', label: 'Le restaurant' },
  { href: '/galerie', label: 'Galerie' },
  { href: '/contact', label: 'Contact & accès' },
] as const
