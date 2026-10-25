import 'server-only'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import sharp, { type Metadata as SharpMetadata } from 'sharp'
import { db } from './db'
import { mediaDir } from './paths'
import type { Media } from '../types'

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024
const TARGET_WIDTHS = [480, 800, 1200, 1600, 2400]
const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp', 'avif', 'heif'])

export class MediaError extends Error {}

type MediaRow = {
  id: string
  kind: 'photo' | 'cutout'
  original_name: string
  alt: string
  width: number
  height: number
  widths: string
  has_alpha: number
  placeholder: string
  color: string
  in_gallery: number
  gallery_sort: number
}

export function toMedia(row: MediaRow): Media {
  return {
    id: row.id,
    kind: row.kind,
    alt: row.alt,
    width: row.width,
    height: row.height,
    widths: JSON.parse(row.widths) as number[],
    hasAlpha: row.has_alpha === 1,
    placeholder: row.placeholder,
    color: row.color,
    inGallery: row.in_gallery === 1,
    gallerySort: row.gallery_sort,
    originalName: row.original_name,
  }
}

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
  const dir = path.join(mediaDir(), id)
  fs.mkdirSync(dir, { recursive: true })

  try {
    const widths = variantWidths(info.width)
    await Promise.all(
      widths.flatMap((w) => {
        const resized = () => sharp(normalized).resize({ width: w, withoutEnlargement: true })
        return [
          resized()
            .avif({ quality: hasAlpha ? 60 : 55, effort: 2 })
            .toFile(path.join(dir, `${w}.avif`)),
          resized()
            .webp({ quality: 80, alphaQuality: 90, effort: 5 })
            .toFile(path.join(dir, `${w}.webp`)),
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
      widths: JSON.stringify(widths),
      has_alpha: hasAlpha ? 1 : 0,
      placeholder,
      color,
      in_gallery: options.inGallery ? 1 : 0,
      gallery_sort: 0,
    }
    db()
      .prepare(
        `INSERT INTO media (id, kind, original_name, alt, width, height, widths, has_alpha, placeholder, color, in_gallery, gallery_sort)
         VALUES (@id, @kind, @original_name, @alt, @width, @height, @widths, @has_alpha, @placeholder, @color, @in_gallery,
                 (SELECT COALESCE(MAX(gallery_sort), 0) + 1 FROM media))`,
      )
      .run(row)
    return toMedia(row)
  } catch (error) {
    fs.rmSync(dir, { recursive: true, force: true })
    throw error
  }
}

export function getMedia(id: string | null | undefined): Media | null {
  if (!id) return null
  const row = db().prepare('SELECT * FROM media WHERE id = ?').get(id) as MediaRow | undefined
  return row ? toMedia(row) : null
}

export function listMedia(kind?: 'photo' | 'cutout'): Media[] {
  const rows = (
    kind
      ? db().prepare('SELECT * FROM media WHERE kind = ? ORDER BY created_at DESC, rowid DESC').all(kind)
      : db().prepare('SELECT * FROM media ORDER BY created_at DESC, rowid DESC').all()
  ) as MediaRow[]
  return rows.map(toMedia)
}

export function listGallery(): Media[] {
  const rows = db()
    .prepare("SELECT * FROM media WHERE in_gallery = 1 AND kind = 'photo' ORDER BY gallery_sort, rowid")
    .all() as MediaRow[]
  return rows.map(toMedia)
}

export function updateMedia(id: string, patch: { alt?: string; inGallery?: boolean }) {
  const current = getMedia(id)
  if (!current) throw new MediaError('Image introuvable.')
  db()
    .prepare('UPDATE media SET alt = ?, in_gallery = ? WHERE id = ?')
    .run((patch.alt ?? current.alt).slice(0, 200), (patch.inGallery ?? current.inGallery) ? 1 : 0, id)
}

export function moveGalleryItem(id: string, direction: -1 | 1) {
  const items = listGallery()
  const index = items.findIndex((m) => m.id === id)
  const swap = items[index + direction]
  if (index < 0 || !swap) return
  const reorder = db().transaction(() => {
    items.forEach((m, i) => db().prepare('UPDATE media SET gallery_sort = ? WHERE id = ?').run(i, m.id))
    db()
      .prepare('UPDATE media SET gallery_sort = ? WHERE id = ?')
      .run(index + direction, id)
    db().prepare('UPDATE media SET gallery_sort = ? WHERE id = ?').run(index, swap.id)
  })
  reorder()
}

export function mediaUsage(id: string): number {
  const row = db()
    .prepare(
      `SELECT (SELECT COUNT(*) FROM products WHERE photo_media_id = ? OR cutout_media_id = ?)
            + (SELECT COUNT(*) FROM categories WHERE cover_media_id = ?) AS n`,
    )
    .get(id, id, id) as { n: number }
  return row.n
}

export function deleteMedia(id: string) {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(id)) throw new MediaError('Identifiant invalide.')
  db().prepare('DELETE FROM media WHERE id = ?').run(id)
  fs.rmSync(path.join(mediaDir(), id), { recursive: true, force: true })
}
