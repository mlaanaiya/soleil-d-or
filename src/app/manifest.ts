import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Soleil d'Or",
    short_name: "Soleil d'Or",
    description: 'Restauration rapide — la carte, les photos et les informations pratiques.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0c0b09',
    theme_color: '#0c0b09',
    lang: 'fr',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}
