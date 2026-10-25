import { ImageResponse } from 'next/og'
import { connection } from 'next/server'
import { getFeatured, getProductsBySlugs } from '@/lib/server/catalog'
import { mediaAsPng, ogFonts } from '@/lib/server/og'
import { getSetting } from '@/lib/server/settings'

export const alt = "Soleil d'Or — restauration rapide"
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpenGraphImage() {
  await connection()
  const { name } = getSetting('restaurant')
  const content = getSetting('content')
  const hero = [...getProductsBySlugs(content.heroProducts), ...getFeatured()].find((p) => p.cutout)
  const product = hero?.cutout ? await mediaAsPng(hero.cutout, 480) : null
  const [first, ...rest] = name.split(' ')

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: '#0c0b09', color: '#f5eddc', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            left: 560,
            top: 60,
            width: 720,
            height: 720,
            borderRadius: 9999,
            background: 'radial-gradient(circle, rgba(255,176,0,0.35), rgba(255,176,0,0) 65%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 690,
            top: 150,
            width: 460,
            height: 460,
            borderRadius: 9999,
            background: 'radial-gradient(circle at 50% 38%, #fff4c8, #ffe08a 16%, #ffc21a 44%, #ffb000 75%, #f08a00)',
          }}
        />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 470, height: 2, background: 'rgba(255,194,26,0.7)' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 472, bottom: 0, background: '#0f0d0a' }} />
        {product && (
          // eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img>
          <img src={product} width={470} style={{ position: "absolute", left: 685, top: 175, width: 470 }} alt="" />
        )}
        <div style={{ position: 'absolute', left: 72, top: 70, display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'Archivo', fontSize: 22, letterSpacing: 6, color: '#b8ae9c' }}>
          <div style={{ width: 12, height: 12, borderRadius: 99, background: '#ffc21a' }} />
          {content.heroKicker.toUpperCase()}
        </div>
        <div style={{ position: 'absolute', left: 64, top: 130, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: 'Archivo Condensed', fontSize: 250, lineHeight: 0.82, letterSpacing: -2 }}>{first!.toUpperCase()}</div>
          <div style={{ fontFamily: 'Instrument Serif', fontStyle: 'italic', fontSize: 150, lineHeight: 1, color: '#ffc21a', marginLeft: 8 }}>{rest.join(' ')}</div>
        </div>
        <div style={{ position: 'absolute', left: 72, bottom: 56, fontFamily: 'Instrument Serif', fontStyle: 'italic', fontSize: 40, color: '#e9dfca' }}>
          {content.heroTagline}
        </div>
      </div>
    ),
    { ...size, fonts: ogFonts() },
  )
}
