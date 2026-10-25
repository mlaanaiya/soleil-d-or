// TEMPORARY production diagnostic — removed right after use.
import { getGalleryShots, getMenu, listCategories, listProducts } from '@/lib/server/catalog'
import { loadSite } from '@/lib/server/public'

export async function GET(request: Request) {
  if (new URL(request.url).searchParams.get('t') !== '3d176b821fa894b6adb24c29fe8df61e') return new Response('Not found', { status: 404 })
  const out: Record<string, string> = {}
  const steps: Array<[string, () => Promise<unknown>]> = [
    ['loadSite', () => loadSite()],
    ['listProducts', () => listProducts({ publicOnly: true })],
    ['listCategories', () => listCategories({ publicOnly: true })],
    ['getMenu', () => getMenu()],
    ['gallery', () => getGalleryShots()],
  ]
  for (const [name, fn] of steps) {
    try {
      const r = await fn()
      out[name] = 'ok ' + JSON.stringify(r).slice(0, 300)
    } catch (e) {
      out[name] = 'ERR ' + (e instanceof Error ? e.stack : String(e))
    }
  }
  return Response.json(out)
}
