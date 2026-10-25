'use server'

import { bool, int, num, runAdmin, str, type ActionState } from '@/lib/server/admin-action'
import { assertAdmin } from '@/lib/server/auth'
import { getSetting, setSetting } from '@/lib/server/settings'
import { hoursSchema } from '@/lib/schemas'

export async function saveRestaurant(_: ActionState, form: FormData): Promise<ActionState> {
  return runAdmin(async () => {
    await setSetting('restaurant', {
      name: str(form, 'name'),
      street: str(form, 'street'),
      postalCode: str(form, 'postalCode'),
      city: str(form, 'city'),
      phone: str(form, 'phone'),
      email: str(form, 'email'),
      lat: num(form, 'lat'),
      lng: num(form, 'lng'),
      socials: {
        instagram: str(form, 'instagram'),
        facebook: str(form, 'facebook'),
        tiktok: str(form, 'tiktok'),
        snapchat: str(form, 'snapchat'),
        google: str(form, 'google'),
      },
    })
  }, 'Informations enregistrées.')
}

export async function saveServices(_: ActionState, form: FormData): Promise<ActionState> {
  return runAdmin(async () => {
    const labels = form.getAll('linkLabel').map(String)
    const urls = form.getAll('linkUrl').map(String)
    const externalLinks = urls
      .map((url, i) => ({ label: (labels[i] ?? '').trim(), url: url.trim() }))
      .filter((l) => l.url !== '' || l.label !== '')
    await setSetting('services', {
      dineIn: bool(form, 'dineIn'),
      takeaway: bool(form, 'takeaway'),
      delivery: bool(form, 'delivery'),
      ordering: {
        enabled: bool(form, 'orderingEnabled'),
        leadMinutes: int(form, 'leadMinutes', 20),
        slotMinutes: int(form, 'slotMinutes', 15),
        note: str(form, 'orderingNote'),
      },
      reservations: {
        enabled: bool(form, 'reservationsEnabled'),
        maxParty: int(form, 'maxParty', 8),
        slotMinutes: int(form, 'resaSlotMinutes', 30),
        leadMinutes: int(form, 'resaLeadMinutes', 120),
        maxDaysAhead: int(form, 'maxDaysAhead', 30),
        note: str(form, 'reservationsNote'),
      },
      externalLinks,
    })
  }, 'Services enregistrés.')
}

/** The hours editor posts its whole state as JSON; the schema is the single source of validation. */
export async function saveHours(_: ActionState, form: FormData): Promise<ActionState> {
  return runAdmin(async () => {
    let raw: unknown
    try {
      raw = JSON.parse(str(form, 'payload'))
    } catch {
      raw = null
    }
    await setSetting('hours', hoursSchema.parse(raw))
  }, 'Horaires enregistrés.')
}

export async function saveContent(_: ActionState, form: FormData): Promise<ActionState> {
  return runAdmin(async () => {
    const current = await getSetting('content')
    const titles = form.getAll('chapterTitle').map(String)
    const texts = form.getAll('chapterText').map(String)
    await setSetting('content', {
      ...current,
      heroKicker: str(form, 'heroKicker'),
      heroTagline: str(form, 'heroTagline'),
      heroProducts: form.getAll('heroProducts').map(String).filter(Boolean).slice(0, 4),
      manifesto: str(form, 'manifesto'),
      featuredTitle: str(form, 'featuredTitle'),
      featuredIntro: str(form, 'featuredIntro'),
      categoriesTitle: str(form, 'categoriesTitle'),
      spotlightTitle: str(form, 'spotlightTitle'),
      spotlightText: str(form, 'spotlightText'),
      spotlightProducts: form.getAll('spotlightProducts').map(String).filter(Boolean).slice(0, 3),
      galleryTitle: str(form, 'galleryTitle'),
      galleryIntro: str(form, 'galleryIntro'),
      restaurantTitle: str(form, 'restaurantTitle'),
      restaurantIntro: str(form, 'restaurantIntro'),
      chapters: titles
        .map((title, i) => ({ title: title.trim(), text: (texts[i] ?? '').trim() }))
        .filter((c) => c.title || c.text),
      ctaTitle: str(form, 'ctaTitle'),
      contactIntro: str(form, 'contactIntro'),
      legalNotice: str(form, 'legalNotice'),
      seoDescription: str(form, 'seoDescription'),
    })
  }, 'Contenus enregistrés.')
}

export type GeocodeResult = { ok: true; lat: number; lng: number; label: string } | { ok: false; error: string }

/** Looks the address up on OpenStreetMap Nominatim (server-side, one request per click). */
export async function geocode(address: string): Promise<GeocodeResult> {
  await assertAdmin()
  const q = address.trim().slice(0, 200)
  if (q.length < 5) return { ok: false, error: 'Renseignez d’abord l’adresse complète.' }
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=fr&q=${encodeURIComponent(q)}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SoleilDOr-site/1.0 (administration)', 'Accept-Language': 'fr' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return { ok: false, error: 'Service de localisation indisponible, réessayez plus tard.' }
    const [hit] = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>
    if (!hit) return { ok: false, error: 'Adresse introuvable. Vérifiez-la ou saisissez les coordonnées.' }
    return {
      ok: true,
      lat: Number(Number(hit.lat).toFixed(6)),
      lng: Number(Number(hit.lon).toFixed(6)),
      label: hit.display_name,
    }
  } catch {
    return { ok: false, error: 'Service de localisation injoignable.' }
  }
}
