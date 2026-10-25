import sharp from 'sharp'
import { query } from '@/lib/server/db'
import { getMediaFile, putMediaFile } from '@/lib/server/media'

const ID = /^[A-Za-z0-9_-]{8,40}$/
const FILE = /^(?:\d{2,4}\.(?:avif|webp)|og\.jpg)$/
const VARIANT = /^(\d{2,4})\.webp$/

/** Social sharing image (1200×630 JPEG), derived once from the largest WebP variant and stored. */
async function ogImage(id: string): Promise<{ contentType: string; bytes: Buffer } | null> {
  const variants = await query<{ name: string }>(
    "SELECT name FROM media_files WHERE media_id = $1 AND name LIKE '%.webp'",
    [id],
  )
  const largest = variants
    .map((v) => VARIANT.exec(v.name))
    .filter((m): m is RegExpExecArray => Boolean(m))
    .sort((a, b) => Number(b[1]) - Number(a[1]))[0]
  if (!largest) return null
  const source = await getMediaFile(id, largest[0])
  if (!source) return null
  const bytes = await sharp(source.bytes)
    .flatten({ background: '#0c0b09' })
    .resize(1200, 630, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer()
  await putMediaFile(id, 'og.jpg', 'image/jpeg', bytes)
  return { contentType: 'image/jpeg', bytes }
}

export async function GET(_request: Request, ctx: RouteContext<'/media/[id]/[file]'>) {
  const { id, file } = await ctx.params
  if (!ID.test(id) || !FILE.test(file)) return new Response('Not found', { status: 404 })

  let found: { contentType: string; bytes: Buffer } | null
  try {
    found = (await getMediaFile(id, file)) ?? (file === 'og.jpg' ? await ogImage(id) : null)
  } catch (error) {
    console.error('[media]', error)
    return new Response('Unavailable', { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
  if (!found) return new Response('Not found', { status: 404 })

  return new Response(new Uint8Array(found.bytes), {
    headers: {
      'Content-Type': found.contentType,
      'Content-Length': String(found.bytes.byteLength),
      // Media ids are never reused: a new upload always gets a new URL (cached by the CDN for a year).
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
