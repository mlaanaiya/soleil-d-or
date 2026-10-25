import 'server-only'
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { getMediaWebp } from './media'
import { assetsDir } from './paths'
import type { Media } from '../types'

let fonts: Array<{ name: string; data: Buffer; weight: 400 | 600 | 800; style: 'normal' | 'italic' }> | null = null

/** Static font instances for Satori (it cannot read variable WOFF2). Loaded once per process. */
export function ogFonts() {
  if (!fonts) {
    const dir = path.join(assetsDir(), 'fonts')
    fonts = [
      {
        name: 'Archivo Condensed',
        data: fs.readFileSync(path.join(dir, 'Archivo-Condensed-ExtraBold.ttf')),
        weight: 800,
        style: 'normal',
      },
      { name: 'Archivo', data: fs.readFileSync(path.join(dir, 'Archivo-SemiBold.ttf')), weight: 600, style: 'normal' },
      {
        name: 'Instrument Serif',
        data: fs.readFileSync(path.join(dir, 'InstrumentSerif-Italic.woff')),
        weight: 400,
        style: 'italic',
      },
    ]
  }
  return fonts
}

/** PNG data URL of a stored image (Satori only decodes PNG/JPEG). */
export async function mediaAsPng(media: Media, width: number): Promise<string | null> {
  try {
    const source = await getMediaWebp(media, width)
    if (!source) return null
    const buffer = await sharp(source).resize({ width }).png({ compressionLevel: 8 }).toBuffer()
    return `data:image/png;base64,${buffer.toString('base64')}`
  } catch {
    return null
  }
}
