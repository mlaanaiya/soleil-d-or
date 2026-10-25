import type { Metadata } from 'next'
import { MediaLibrary, type AdminMedia } from '@/components/admin/MediaLibrary'
import { listMedia, mediaStats } from '@/lib/server/media'
import type { Media } from '@/lib/types'

export const metadata: Metadata = { title: 'Photos & galerie' }

function toAdmin(m: Media, stats: Awaited<ReturnType<typeof mediaStats>>): AdminMedia {
  const w = m.widths.find((x) => x >= 400) ?? m.widths.at(-1)
  const stat = stats.get(m.id)
  return {
    id: m.id,
    url: `/media/${m.id}/${w}.webp`,
    alt: m.alt,
    kind: m.kind,
    inGallery: m.inGallery,
    usage: stat?.usage ?? 0,
    size: stat ? `${(stat.bytes / 1024 / 1024).toFixed(1)} Mo` : '—',
  }
}

export default async function PhotosAdmin() {
  const [allPhotos, allCutouts, stats] = await Promise.all([
    await listMedia('photo'),
    await listMedia('cutout'),
    await mediaStats(),
  ])
  const photos = allPhotos
    .sort((a, b) => Number(b.inGallery) - Number(a.inGallery) || a.gallerySort - b.gallerySort)
    .map((m) => toAdmin(m, stats))
  return (
    <>
      <header className="adm-page-head">
        <div>
          <h1 className="adm-title">Photos & galerie</h1>
          <p className="adm-sub">Importez, décrivez et organisez les photographies du restaurant.</p>
        </div>
      </header>
      <MediaLibrary photos={photos} cutouts={allCutouts.map((m) => toAdmin(m, stats))} />
    </>
  )
}
