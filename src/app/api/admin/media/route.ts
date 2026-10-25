import { revalidatePath } from 'next/cache'
import { currentUser } from '@/lib/server/auth'
import { importImage, MAX_UPLOAD_BYTES, MediaError } from '@/lib/server/media'

/** Rejects cross-site submissions: the Origin header must match the host serving the admin. */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return false
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Origine refusée.' }, { status: 403 })
  if (!(await currentUser())) return Response.json({ error: 'Session expirée, reconnectez-vous.' }, { status: 401 })

  const length = Number(request.headers.get('content-length') ?? 0)
  if (length > MAX_UPLOAD_BYTES * 4 + 1024 * 1024) return Response.json({ error: 'Envoi trop volumineux.' }, { status: 413 })

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return Response.json({ error: 'Envoi illisible.' }, { status: 400 })
  }
  const kind = form.get('kind') === 'cutout' ? 'cutout' : 'photo'
  const inGallery = form.get('inGallery') === 'true'
  const files = form.getAll('file').filter((f): f is File => f instanceof File).slice(0, 12)
  if (files.length === 0) return Response.json({ error: 'Aucun fichier reçu.' }, { status: 400 })

  const created = []
  const errors: string[] = []
  for (const file of files) {
    try {
      const alt = String(form.get('alt') ?? '').trim() || file.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ')
      created.push(
        await importImage(Buffer.from(await file.arrayBuffer()), { kind, alt, originalName: file.name, inGallery }),
      )
    } catch (error) {
      errors.push(`${file.name} : ${error instanceof MediaError ? error.message : 'import impossible.'}`)
      if (!(error instanceof MediaError)) console.error('[upload]', error)
    }
  }
  if (created.length > 0) revalidatePath('/', 'layout')
  return Response.json({ created, errors }, { status: created.length > 0 ? 200 : 422 })
}
