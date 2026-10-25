import 'server-only'
import crypto from 'node:crypto'
import sharp, { type Metadata as SharpMetadata } from 'sharp'
import { one, query, transaction } from './db'
import type { Media } from '../types'

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024
const TARGET_WIDTHS = [480, 800, 1200, 1600, 2400]
const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp', 'avif', 'heif'])

export class MediaError extends Error {}

export type MediaRow = {
  id: string
  kind: 'photo' | 'cutout'
  original_name: string
  alt: string
  width: number
  height: number
  widths: number[]
  has_alpha: boolean
  placeholder: string
  color: string
  in_gallery: boolean
  gallery_sort: number
}

export function toMedia(row: MediaRow): Media {
  return {
    id: row.id,
    kind: row.kind,
    alt: row.alt,
    width: row.width,
    height: row.height,
    widths: row.widths,
    hasAlpha: row.has_alpha,
    placeholder: row.placeholder,
    color: row.color,
    inGallery: row.in_gallery,
    gallerySort: row.gallery_sort,
    originalName: row.original_name,
  }
}

// Every column except the timestamps (never exposed) — bytes live in media_files.
const MEDIA_COLUMNS =
  'id, kind, original_name, alt, width, height, widths, has_alpha, placeholder, color, in_gallery, gallery_sort'

function newId() {
  return crypto.randomBytes(12).toString('base64url')
}

function variantWidths(width: number): number[] {
  const widths = TARGET_WIDTHS.filter((w) => w < width)
  widths.push(Math.min(width, TARGET_WIDTHS.at(-1)!))
  return [...new Set(widths)].sort((a, b) => a - b)
}

/**
 * Decodes, validates and converts an uploaded image into responsive AVIF/WebP variants.
 * The decoder is the source of truth for the format: file names and MIME types are ignored.
 */
export async function importImage(
  input: Buffer,
  options: { kind: 'photo' | 'cutout'; alt: string; originalName?: string; inGallery?: boolean },
): Promise<Media> {
  if (input.byteLength > MAX_UPLOAD_BYTES) throw new MediaError('Image trop lourde (15 Mo maximum).')

  let meta: SharpMetadata
  try {
    meta = await sharp(input, { limitInputPixels: 60_000_000 }).metadata()
  } catch {
    throw new MediaError('Ce fichier n’est pas une image lisible.')
  }
  if (!meta.format || !ACCEPTED_FORMATS.has(meta.format)) {
    throw new MediaError('Format non pris en charge. Utilisez JPEG, PNG, WebP ou AVIF.')
  }

  // Normalise orientation once; metadata (EXIF, GPS…) is dropped by default on output.
  const base = sharp(input, { limitInputPixels: 60_000_000 }).rotate()
  const { data: normalized, info } = await base.toBuffer({ resolveWithObject: true })
  if (info.width < 320 || info.height < 240) throw new MediaError('Image trop petite (320 × 240 minimum).')

  const hasAlpha = options.kind === 'cutout' && (meta.hasAlpha ?? false)
  if (options.kind === 'cutout' && !hasAlpha) {
    throw new MediaError('Un détourage doit être un PNG ou WebP avec transparence.')
  }

  const id = newId()
  const widths = variantWidths(info.width)
  const files = await Promise.all(
    widths.flatMap((w) => {
      const resized = () => sharp(normalized).resize({ width: w, withoutEnlargement: true })
      return [
        resized()
          .avif({ quality: hasAlpha ? 60 : 55, effort: 2 })
          .toBuffer()
          .then((bytes) => ({ name: `${w}.avif`, type: 'image/avif', bytes })),
        resized()
          .webp({ quality: 80, alphaQuality: 90, effort: 5 })
          .toBuffer()
          .then((bytes) => ({ name: `${w}.webp`, type: 'image/webp', bytes })),
      ]
    }),
  )

  const tiny = await sharp(normalized).resize({ width: 24 }).blur(0.6).webp({ quality: 40 }).toBuffer()
  const placeholder = `data:image/webp;base64,${tiny.toString('base64')}`
  const { dominant } = await sharp(normalized).stats()
  const color = `#${[dominant.r, dominant.g, dominant.b].map((c) => c.toString(16).padStart(2, '0')).join('')}`

  const row: MediaRow = {
    id,
    kind: options.kind,
    original_name: (options.originalName ?? '').slice(0, 160),
    alt: options.alt.slice(0, 200),
    width: info.width,
    height: info.height,
    widths,
    has_alpha: hasAlpha,
    placeholder,
    color,
    in_gallery: options.inGallery ?? false,
    gallery_sort: 0,
  }
  await transaction(async (tx) => {
    const [{ sort }] = (await tx.query<{ sort: number }>(
      `INSERT INTO media (id, kind, original_name, alt, width, height, widths, has_alpha, placeholder, color, in_gallery, gallery_sort)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11,
               (SELECT COALESCE(MAX(gallery_sort), 0) + 1 FROM media))
       RETURNING gallery_sort AS sort`,
      [
        row.id,
        row.kind,
        row.original_name,
        row.alt,
        row.width,
        row.height,
        JSON.stringify(row.widths),
        row.has_alpha,
        row.placeholder,
        row.color,
        row.in_gallery,
      ],
    )) as [{ sort: number }]
    row.gallery_sort = sort
    for (const file of files) {
      await tx.query('INSERT INTO media_files (media_id, name, content_type, bytes) VALUES ($1, $2, $3, $4)', [
        id,
        file.name,
        file.type,
        file.bytes,
      ])
    }
  })
  return toMedia(row)
}

/** One stored file of a media (variant or derived image), or null. */
export async function getMediaFile(id: string, name: string): Promise<{ contentType: string; bytes: Buffer } | null> {
  const row = await one<{ content_type: string; bytes: Uint8Array }>(
    'SELECT content_type, bytes FROM media_files WHERE media_id = $1 AND name = $2',
    [id, name],
  )
  return row ? { contentType: row.content_type, bytes: Buffer.from(row.bytes) } : null
}

export async function putMediaFile(id: string, name: string, contentType: string, bytes: Buffer) {
  await query(
    `INSERT INTO media_files (media_id, name, content_type, bytes) VALUES ($1, $2, $3, $4)
     ON CONFLICT (media_id, name) DO NOTHING`,
    [id, name, contentType, bytes],
  )
}

/** The WebP variant closest to (and at least) `width`, falling back to the largest one. */
export async function getMediaWebp(media: Media, width: number): Promise<Buffer | null> {
  const w = media.widths.find((x) => x >= width) ?? media.widths.at(-1)
  return (await getMediaFile(media.id, `${w}.webp`))?.bytes ?? null
}

export async function getMedia(id: string | null | undefined): Promise<Media | null> {
  if (!id) return null
  const row = await one<MediaRow>(`SELECT ${MEDIA_COLUMNS} FROM media WHERE id = $1`, [id])
  return row ? toMedia(row) : null
}

export async function listMedia(kind?: 'photo' | 'cutout'): Promise<Media[]> {
  const rows = kind
    ? await query<MediaRow>(`SELECT ${MEDIA_COLUMNS} FROM media WHERE kind = $1 ORDER BY created_at DESC, id`, [kind])
    : await query<MediaRow>(`SELECT ${MEDIA_COLUMNS} FROM media ORDER BY created_at DESC, id`)
  return rows.map(toMedia)
}

export async function listGallery(): Promise<Media[]> {
  const rows = await query<MediaRow>(
    `SELECT ${MEDIA_COLUMNS} FROM media WHERE in_gallery AND kind = 'photo' ORDER BY gallery_sort, created_at, id`,
  )
  return rows.map(toMedia)
}

export async function updateMedia(id: string, patch: { alt?: string; inGallery?: boolean }) {
  const current = await getMedia(id)
  if (!current) throw new MediaError('Image introuvable.')
  await query('UPDATE media SET alt = $1, in_gallery = $2 WHERE id = $3', [
    (patch.alt ?? current.alt).slice(0, 200),
    patch.inGallery ?? current.inGallery,
    id,
  ])
}

export async function moveGalleryItem(id: string, direction: -1 | 1) {
  const items = await listGallery()
  const index = items.findIndex((m) => m.id === id)
  const swap = items[index + direction]
  if (index < 0 || !swap) return
  const order = items.map((m) => m.id)
  ;[order[index], order[index + direction]] = [swap.id, id]
  await transaction(async (tx) => {
    for (const [i, mediaId] of order.entries()) {
      await tx.query('UPDATE media SET gallery_sort = $1 WHERE id = $2', [i, mediaId])
    }
  })
}

export async function mediaUsage(id: string): Promise<number> {
  const row = await one<{ n: number }>(
    `SELECT ((SELECT COUNT(*) FROM products WHERE photo_media_id = $1 OR cutout_media_id = $1)
           + (SELECT COUNT(*) FROM categories WHERE cover_media_id = $1))::int AS n`,
    [id],
  )
  return row?.n ?? 0
}

/** Per-media usage count (products and category covers) and stored size, in one query. */
export async function mediaStats(): Promise<Map<string, { usage: number; bytes: number }>> {
  const rows = await query<{ id: string; usage: number; bytes: number }>(
    `SELECT m.id,
            ((SELECT COUNT(*) FROM products p WHERE p.photo_media_id = m.id OR p.cutout_media_id = m.id)
           + (SELECT COUNT(*) FROM categories c WHERE c.cover_media_id = m.id))::int AS usage,
            (SELECT COALESCE(SUM(octet_length(f.bytes)), 0) FROM media_files f WHERE f.media_id = m.id)::float8 AS bytes
     FROM media m`,
  )
  return new Map(rows.map((r) => [r.id, { usage: r.usage, bytes: Number(r.bytes) }]))
}

export async function deleteMedia(id: string) {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(id)) throw new MediaError('Identifiant invalide.')
  // Stored files go with it (ON DELETE CASCADE).
  await query('DELETE FROM media WHERE id = $1', [id])
}
