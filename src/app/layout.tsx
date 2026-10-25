import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { headers } from 'next/headers'
import Script from 'next/script'
import '@/styles/globals.css'
import { siteUrl } from '@/lib/site'

const archivo = localFont({
  src: '../../node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2',
  variable: '--font-archivo',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  declarations: [{ prop: 'font-stretch', value: '62% 125%' }],
  adjustFontFallback: 'Arial',
})

const instrument = localFont({
  src: [
    { path: '../../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2', style: 'italic', weight: '400' },
    { path: '../../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2', style: 'normal', weight: '400' },
  ],
  variable: '--font-instrument',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  applicationName: "Soleil d'Or",
  formatDetection: { telephone: false, address: false, email: false },
}

export const viewport: Viewport = {
  themeColor: '#0c0b09',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

// Flags motion support before hydration; only below-the-fold reveals depend on it.
const BOOT = `try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.setAttribute('data-motion','')}catch(e){}`

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined
  return (
    <html lang="fr" className={`${archivo.variable} ${instrument.variable}`} suppressHydrationWarning>
      <body>
        {children}
        <Script id="motion-flag" strategy="beforeInteractive" nonce={nonce}>
          {BOOT}
        </Script>
      </body>
    </html>
  )
}
