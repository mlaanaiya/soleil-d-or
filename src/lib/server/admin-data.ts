import 'server-only'
import { listMedia } from './media'
import type { LibraryItem } from '@/components/admin/MediaPicker'
import type { Media } from '../types'

function toItem(m: Media): LibraryItem {
  const w = m.widths.find((x) => x >= 400) ?? m.widths.at(-1)
  return { id: m.id, alt: m.alt, url: `/media/${m.id}/${w}.webp` }
}

/** Photo and cut-out libraries for the admin media pickers. */
export function mediaLibraries() {
  return { photos: listMedia('photo').map(toItem), cutouts: listMedia('cutout').map(toItem) }
}

export const centsToInput = (cents: number) => (cents / 100).toFixed(2).replace('.', ',')
