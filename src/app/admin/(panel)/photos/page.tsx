import fs from 'node:fs'
import path from 'node:path'
import type { Metadata } from 'next'
import { MediaLibrary, type AdminMedia } from '@/components/admin/MediaLibrary'
import { listMedia, mediaUsage } from '@/lib/server/media'
import { mediaDir } from '@/lib/server/paths'
import type { Media } from '@/lib/types'

export const metadata: Metadata = { title: 'Photos & galerie' }

function folderSize(id: string): string {
  try {
    const dir = path.join(mediaDir(), id)
    const bytes = fs.readdirSync(dir).reduce((n, f) => n + fs.statSync(path.join(dir, f)).size, 0)
    return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
  } catch {
    return '—'
  }
}

function toAdmin(m: Media): AdminMedia {
  const w = m.widths.find((x) => x >= 400) ?? m.widths.at(-1)
  return { id: m.id, url: `/media/${m.id}/${w}.webp`, alt: m.alt, kind: m.kind, inGallery: m.inGallery, usage: mediaUsage(m.id), size: folderSize(m.id) }
}

export default async function PhotosAdmin() {
  const photos = listMedia('photo')
    .sort((a, b) => Number(b.inGallery) - Number(a.inGallery) || a.gallerySort - b.gallerySort)
    .map(toAdmin)
  return (
    <>
      <header className="adm-page-head">
        <div>
          <h1 className="adm-title">Photos & galerie</h1>
          <p className="adm-sub">Importez, décrivez et organisez les photographies du restaurant.</p>
        </div>
      </header>
      <MediaLibrary photos={photos} cutouts={listMedia('cutout').map(toAdmin)} />
    </>
  )
}
