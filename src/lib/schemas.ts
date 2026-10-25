import { z } from 'zod'

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

export const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format attendu : HH:MM')
export const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format attendu : AAAA-MM-JJ')

const trimmed = (max: number) => z.string().trim().max(max)
const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^https:\/\/[^\s]+$/i.test(v), 'Adresse web en https:// attendue')

export const priceSchema = z.object({
  label: trimmed(40).default(''),
  cents: z.number().int().min(0).max(100_000),
})
export type Price = z.infer<typeof priceSchema>

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export const restaurantSchema = z.object({
  name: trimmed(80).min(1).default("Soleil d'Or"),
  street: trimmed(160).default(''),
  postalCode: trimmed(12).default(''),
  city: trimmed(80).default(''),
  phone: trimmed(30).default(''),
  email: z
    .string()
    .trim()
    .max(160)
    .refine((v) => v === '' || z.email().safeParse(v).success, 'Adresse e-mail invalide')
    .default(''),
  lat: z.number().min(-90).max(90).nullable().default(null),
  lng: z.number().min(-180).max(180).nullable().default(null),
  socials: z
    .object({
      instagram: optionalUrl.default(''),
      facebook: optionalUrl.default(''),
      tiktok: optionalUrl.default(''),
      snapchat: optionalUrl.default(''),
      google: optionalUrl.default(''),
    })
    .default({ instagram: '', facebook: '', tiktok: '', snapchat: '', google: '' }),
})
export type Restaurant = z.infer<typeof restaurantSchema>

export const slotSchema = z.object({ open: timeString, close: timeString })
export type Slot = z.infer<typeof slotSchema>

export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export type Day = (typeof DAYS)[number]
export const DAY_LABELS: Record<Day, string> = {
  mon: 'Lundi',
  tue: 'Mardi',
  wed: 'Mercredi',
  thu: 'Jeudi',
  fri: 'Vendredi',
  sat: 'Samedi',
  sun: 'Dimanche',
}

const daySlots = z.array(slotSchema).max(4).default([])

export const hoursSchema = z.object({
  week: z
    .object({
      mon: daySlots,
      tue: daySlots,
      wed: daySlots,
      thu: daySlots,
      fri: daySlots,
      sat: daySlots,
      sun: daySlots,
    })
    .default({ mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }),
  exceptions: z
    .array(
      z.object({
        date: dateString,
        label: trimmed(80).default(''),
        slots: z.array(slotSchema).max(4).default([]),
      }),
    )
    .max(60)
    .default([]),
  note: trimmed(240).default(''),
})
export type Hours = z.infer<typeof hoursSchema>

export const servicesSchema = z.object({
  dineIn: z.boolean().default(false),
  takeaway: z.boolean().default(false),
  delivery: z.boolean().default(false),
  ordering: z
    .object({
      enabled: z.boolean().default(false),
      leadMinutes: z.number().int().min(5).max(240).default(20),
      slotMinutes: z.number().int().min(5).max(60).default(15),
      note: trimmed(400).default(''),
    })
    .default({ enabled: false, leadMinutes: 20, slotMinutes: 15, note: '' }),
  reservations: z
    .object({
      enabled: z.boolean().default(false),
      maxParty: z.number().int().min(1).max(60).default(8),
      slotMinutes: z.number().int().min(10).max(120).default(30),
      leadMinutes: z.number().int().min(0).max(2880).default(120),
      maxDaysAhead: z.number().int().min(1).max(180).default(30),
      note: trimmed(400).default(''),
    })
    .default({ enabled: false, maxParty: 8, slotMinutes: 30, leadMinutes: 120, maxDaysAhead: 30, note: '' }),
  externalLinks: z
    .array(z.object({ label: trimmed(40).min(1), url: optionalUrl.refine((v) => v !== '', 'Lien requis') }))
    .max(6)
    .default([]),
})
export type Services = z.infer<typeof servicesSchema>

export const chapterSchema = z.object({ title: trimmed(80), text: trimmed(1200) })

export const contentSchema = z.object({
  heroKicker: trimmed(60).default('Restauration rapide'),
  heroTagline: trimmed(140).default('Le goût en pleine lumière.'),
  heroProducts: z.array(z.string()).max(4).default([
    'double-cheeseburger',
    'naan-kebab',
    'tacos-poulet',
  ]),
  manifesto: trimmed(600).default(
    'Sous le soleil, tout devient plus doré. Sandwichs, assiettes, tacos, burgers, crousty riz et bowls : chaque recette est mise en lumière, du premier coup d’œil à la dernière bouchée.',
  ),
  featuredTitle: trimmed(80).default('Les incontournables'),
  featuredIntro: trimmed(300).default('Une sélection de la carte, choisie par la maison.'),
  categoriesTitle: trimmed(80).default('Huit façons de prendre le soleil'),
  spotlightTitle: trimmed(80).default('Crousty riz & bowls'),
  spotlightText: trimmed(500).default(
    'Le croustillant rencontre le moelleux. Riz, frites, poulet croustillant, sauces : des bols généreux à composer du regard avant de les goûter.',
  ),
  spotlightProducts: z.array(z.string()).max(3).default(['crousty-riz-poulet', 'bowl-gourmand']),
  galleryTitle: trimmed(80).default('La galerie'),
  galleryIntro: trimmed(300).default('Nos recettes, photographiées en pleine lumière.'),
  restaurantTitle: trimmed(80).default('Notre restaurant'),
  restaurantIntro: trimmed(600).default(
    'Soleil d’Or, c’est une carte de restauration rapide pensée comme une affiche : du noir charbon, du crème, et une lumière jaune qui fait briller chaque produit.',
  ),
  chapters: z.array(chapterSchema).max(6).default([
    {
      title: 'La lumière',
      text: 'Noir charbon, crème lumineux, jaune solaire. Notre identité tient en trois couleurs, des affiches du restaurant jusqu’aux écrans du comptoir.',
    },
    {
      title: 'La carte',
      text: 'Sandwichs, assiettes, tacos, burgers, crousty riz, bowls, accompagnements et boissons : huit familles pour toutes les faims.',
    },
    {
      title: 'Le geste',
      text: 'Du grillé, du doré, du croustillant. Les produits de la carte sont présentés tels qu’ils arrivent dans l’assiette.',
    },
  ]),
  ctaTitle: trimmed(80).default('Une petite faim ?'),
  contactIntro: trimmed(400).default('Toutes les informations pratiques pour venir à Soleil d’Or.'),
  legalNotice: trimmed(6000).default(''),
  seoDescription: trimmed(170).default(
    "Soleil d'Or, restauration rapide : sandwichs, assiettes, tacos, burgers, crousty riz, bowls. Découvrez la carte, les photos et les informations pratiques.",
  ),
})
export type Content = z.infer<typeof contentSchema>

export const SETTINGS = {
  restaurant: restaurantSchema,
  hours: hoursSchema,
  services: servicesSchema,
  content: contentSchema,
} as const
export type SettingsKey = keyof typeof SETTINGS
export type SettingsValue<K extends SettingsKey> = z.infer<(typeof SETTINGS)[K]>

/* ------------------------------------------------------------------ */
/* Catalogue                                                           */
/* ------------------------------------------------------------------ */

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lettres minuscules, chiffres et tirets uniquement')

export const productInputSchema = z.object({
  name: trimmed(80).min(1, 'Le nom est obligatoire'),
  slug: slugSchema,
  categoryId: z.number().int().positive(),
  description: trimmed(600).default(''),
  details: trimmed(600).default(''),
  prices: z.array(priceSchema).max(6).default([]),
  photoMediaId: z.string().max(40).nullable().default(null),
  cutoutMediaId: z.string().max(40).nullable().default(null),
  available: z.boolean().default(true),
  visible: z.boolean().default(true),
  featured: z.boolean().default(false),
  badge: trimmed(24).default(''),
})
export type ProductInput = z.infer<typeof productInputSchema>

export const categoryInputSchema = z.object({
  name: trimmed(60).min(1, 'Le nom est obligatoire'),
  slug: slugSchema,
  tagline: trimmed(120).default(''),
  description: trimmed(600).default(''),
  coverMediaId: z.string().max(40).nullable().default(null),
  visible: z.boolean().default(true),
})
export type CategoryInput = z.infer<typeof categoryInputSchema>

/* ------------------------------------------------------------------ */
/* Public forms                                                        */
/* ------------------------------------------------------------------ */

const phone = z
  .string()
  .trim()
  .min(6, 'Numéro de téléphone invalide')
  .max(24)
  .regex(/^[+0-9 ().-]+$/, 'Numéro de téléphone invalide')

export const orderInputSchema = z.object({
  name: trimmed(60).min(2, 'Indiquez votre nom'),
  phone,
  pickupAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Choisissez un créneau'),
  note: trimmed(300).default(''),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        priceIndex: z.number().int().min(0).max(5),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1, 'Votre panier est vide')
    .max(30),
})
export type OrderInput = z.infer<typeof orderInputSchema>

export const reservationInputSchema = z.object({
  name: trimmed(60).min(2, 'Indiquez votre nom'),
  phone,
  email: z
    .string()
    .trim()
    .max(160)
    .refine((v) => v === '' || z.email().safeParse(v).success, 'Adresse e-mail invalide')
    .default(''),
  date: dateString,
  time: timeString,
  partySize: z.number().int().min(1).max(60),
  note: trimmed(300).default(''),
})
export type ReservationInput = z.infer<typeof reservationInputSchema>

export const ORDER_STATUSES = ['new', 'accepted', 'ready', 'done', 'cancelled'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Nouvelle',
  accepted: 'En préparation',
  ready: 'Prête à retirer',
  done: 'Retirée',
  cancelled: 'Annulée',
}

export const RESERVATION_STATUSES = ['pending', 'confirmed', 'declined', 'cancelled'] as const
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number]
export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: 'En attente de confirmation',
  confirmed: 'Confirmée',
  declined: 'Refusée',
  cancelled: 'Annulée',
}
