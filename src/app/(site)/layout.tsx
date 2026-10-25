import { Footer } from '@/components/site/Footer'
import { Header } from '@/components/site/Header'
import { MobileDock } from '@/components/site/MobileDock'
import { MotionProvider } from '@/components/motion/MotionProvider'
import { PointerLight } from '@/components/motion/PointerLight'
import { RevealObserver } from '@/components/motion/RevealObserver'
import { SunCourse } from '@/components/motion/SunCourse'
import { SunTransition } from '@/components/motion/SunTransition'
import type { Metadata } from 'next'
import { loadSite } from '@/lib/server/public'

export async function generateMetadata(): Promise<Metadata> {
  const site = await loadSite()
  const name = site.restaurant.name
  const where = site.restaurant.city ? ` à ${site.restaurant.city}` : ''
  return {
    title: `${name} — Restauration rapide${where}`,
    description: site.content.seoDescription,
    alternates: { canonical: '/' },
    openGraph: { type: 'website', locale: 'fr_FR', siteName: name },
    twitter: { card: 'summary_large_image' },
  }
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const site = await loadSite()
  const cta = site.canOrder ? { href: '/commander', label: 'Commander' } : { href: '/carte', label: 'Voir la carte' }

  return (
    <MotionProvider>
      <a href="#contenu" className="skip-link">
        Aller au contenu
      </a>
      <Header
        name={site.restaurant.name}
        status={{ state: site.status.state, label: site.statusLabel }}
        cta={cta}
        phone={site.restaurant.phone}
        directions={site.directions?.google ?? null}
        socials={site.socials}
      />
      <main id="contenu">{children}</main>
      <Footer site={site} />
      <MobileDock
        phone={site.restaurant.phone}
        directions={site.directions?.google ?? null}
        cta={site.canOrder ? { href: '/commander', label: 'Commander' } : null}
      />
      <SunCourse />
      <PointerLight />
      <RevealObserver />
      <SunTransition />
      <div className="grain" aria-hidden="true" />
    </MotionProvider>
  )
}
