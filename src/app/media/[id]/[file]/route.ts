import fs from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'
import sharp from 'sharp'
import { mediaDir } from '@/lib/server/paths'

const ID = /^[A-Za-z0-9_-]{8,40}$/
const FILE = /^(?:(\d{2,4})\.(avif|webp)|og\.jpg)$/
const TYPES = { avif: 'image/avif', webp: 'image/webp', jpg: 'image/jpeg' } as const

/** Social sharing image (1200×630 JPEG), derived once from the largest WebP variant. */
async function ensureOgImage(dir: string): Promise<boolean> {
  const target = path.join(dir, 'og.jpg')
  if (fs.existsSync(target)) return true
  const largest = fs
    .readdirSync(dir)
    .filter((f) => /^\d+\.webp$/.test(f))
    .sort((a, b) => parseInt(b) - parseInt(a))[0]
  if (!largest) return false
  const tmp = `${target}.${process.pid}.tmp`
  await sharp(path.join(dir, largest))
    .flatten({ background: '#0c0b09' })
    .resize(1200, 630, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(tmp)
  fs.renameSync(tmp, target)
  return true
}

export async function GET(_request: Request, ctx: RouteContext<'/media/[id]/[file]'>) {
  const { id, file } = await ctx.params
  const match = FILE.exec(file)
  if (!ID.test(id) || !match) return new Response('Not found', { status: 404 })

  const dir = path.join(mediaDir(), id)
  if (file === 'og.jpg') {
    try {
      if (!(await ensureOgImage(dir))) return new Response('Not found', { status: 404 })
    } catch {
      return new Response('Not found', { status: 404 })
    }
  }

  const filePath = path.join(dir, file)
  let stat: fs.Stats
  try {
    stat = await fs.promises.stat(filePath)
  } catch {
    return new Response('Not found', { status: 404 })
  }

  const ext = (match[2] ?? 'jpg') as keyof typeof TYPES
  const stream = Readable.toWeb(fs.createReadStream(filePath)) as ReadableStream
  return new Response(stream, {
    headers: {
      'Content-Type': TYPES[ext],
      'Content-Length': String(stat.size),
      // Media ids are never reused: a new upload always gets a new URL.
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
