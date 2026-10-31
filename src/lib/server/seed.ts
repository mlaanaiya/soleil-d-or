import 'server-only'
import fs from 'node:fs'
import path from 'node:path'
import { one, query } from './db'
import { importImage } from './media'
import { assetsDir } from './paths'
import { countUsers, upsertUser } from './security'
import { setSetting } from './settings'

/**
 * Initial catalogue: the restaurant's real menu and prices, illustrated with its own photographs.
 * A product without a matching photograph has none (never a look-alike).
 */
const CATEGORIES = [
  { slug: 'burgers', name: 'Burgers', tagline: 'Haut en couleur.' },
  { slug: 'tacos', name: 'Tacos', tagline: 'Grillés, fondants, pliés.' },
  { slug: 'naans-paninis', name: 'Naans & paninis', tagline: 'Dans le pain, tout le soleil.' },
  { slug: 'assiettes', name: 'Assiettes', tagline: 'Le grand format, servi à l’assiette.' },
  { slug: 'bowls', name: 'Bowls & crousty riz', tagline: 'Tout dans le bol.' },
  { slug: 'accompagnements', name: 'Barquettes & accompagnements', tagline: 'À côté, jamais en retrait.' },
  { slug: 'boissons', name: 'Boissons & desserts', tagline: 'Pour accompagner le soleil.' },
  { slug: 'menu-enfant', name: 'Menu enfant', tagline: 'Pour les petits.' },
] as const

type SeedProduct = {
  slug: string
  name: string
  category: (typeof CATEGORIES)[number]['slug']
  /** Price rows as [label, euros]. */
  prices: Array<[string, string]>
  file?: string
  alt?: string
  description?: string
  cutout?: boolean
  featured?: boolean
}

const trio = (seul: string, frites: string, menu?: string): Array<[string, string]> => [
  ['Seul', seul],
  ['+ Frites', frites],
  ...(menu ? [['Menu', menu] as [string, string]] : []),
]
const plate = (file: string | undefined, slug: string, name: string, alt?: string): SeedProduct => ({
  slug,
  name,
  category: 'assiettes',
  prices: [
    ['Seul', '11,00'],
    ['Menu', '12,50'],
  ],
  ...(file ? { file, alt, description: alt ? `${alt}.` : undefined } : {}),
})

const PRODUCTS: SeedProduct[] = [
  { slug: 'burger-classique', name: 'Burger classique', category: 'burgers', prices: trio('3,00', '7,00', '8,50') },
  { slug: 'cheeseburger', name: 'Cheeseburger', category: 'burgers', prices: trio('3,50', '7,00', '8,50') },
  {
    slug: 'double-steak',
    name: 'Double steak',
    category: 'burgers',
    prices: trio('6,00', '7,00', '8,50'),
    file: 'double-cheeseburger-gourmand-sur-fond-sombre',
    alt: 'Burger double steak sur fond sombre',
    cutout: true,
    featured: true,
  },
  {
    slug: 'tacos-simple',
    name: 'Tacos simple',
    category: 'tacos',
    prices: trio('6,00', '7,00', '8,50'),
    file: 'tacos-francais-grille-au-poulet-et-frites',
    alt: 'Tacos français grillé au poulet et frites',
    description: 'Tacos à la française, grillé.',
    cutout: true,
    featured: true,
  },
  { slug: 'tacos-double', name: 'Tacos double', category: 'tacos', prices: trio('8,50', '10,00', '12,00') },
  {
    slug: 'naan-garni',
    name: 'Naan garni',
    category: 'naans-paninis',
    prices: trio('5,00', '6,00', '7,50'),
    file: 'sandwich-naan-kebab-gourmand',
    alt: 'Naan garni',
    cutout: true,
    featured: true,
  },
  {
    slug: 'panini-garni',
    name: 'Panini garni',
    category: 'naans-paninis',
    prices: trio('5,00', '6,00', '7,50'),
    file: 'panini-grille-au-poulet-et-fromage',
    alt: 'Panini grillé garni',
    cutout: true,
  },
  { slug: 'panini-3-fromages', name: 'Panini 3 fromages', category: 'naans-paninis', prices: trio('3,00', '4,50') },
  plate(undefined, 'assiette-kebab', 'Kebab'),
  plate('koftas-grilles-frites-et-salade', 'assiette-kefta', 'Kefta', 'Kefta grillées, frites et salade'),
  plate('steaks-grilles-frites-et-salade', 'assiette-steak', 'Steak', 'Steaks grillés, frites et salade'),
  plate(
    'nuggets-croustillants-frites-et-salade-fraiche',
    'assiette-nuggets',
    'Nuggets',
    'Nuggets croustillants, frites et salade fraîche',
  ),
  plate(
    'tenders-croustillants-frites-et-salade',
    'assiette-tenders',
    'Tenders',
    'Tenders croustillants, frites et salade',
  ),
  plate('ailes-de-poulet-frites-et-salade', 'assiette-wings', 'Wings', 'Ailes de poulet, frites et salade'),
  plate('poulet-grille-frites-et-salade', 'assiette-chicken', 'Chicken', 'Poulet grillé, frites et salade'),
  plate(
    'falafels-dores-frites-et-salade-fraiche',
    'assiette-falafel',
    'Falafel',
    'Falafels dorés, frites et salade fraîche',
  ),
  plate('merguez-grillees-frites-et-salade', 'assiette-merguez', 'Merguez', 'Merguez grillées, frites et salade'),
  {
    ...plate('cordon-bleu-frites-et-salade', 'cordon-bleu', 'Cordon bleu', 'Cordon bleu, frites et salade'),
    featured: true,
  },
  {
    slug: 'assiette-royale',
    name: 'Assiette royale',
    category: 'assiettes',
    prices: [['Seul', '15,00']],
    file: 'assiette-grillee-frites-et-salade-fraiche',
    alt: 'Assiette royale : grillades, frites et salade fraîche',
    description: 'Grillades, frites et salade fraîche.',
    featured: true,
  },
  {
    slug: 'salade-thon',
    name: 'Salade de thon',
    category: 'assiettes',
    prices: [['Seul', '7,50']],
    file: 'salade-de-thon-fraiche-aux-legumes',
    alt: 'Salade de thon fraîche aux légumes',
    description: 'Salade de thon fraîche aux légumes.',
    cutout: true,
  },
  {
    slug: 'bowl',
    name: 'Bowl',
    category: 'bowls',
    prices: [
      ['Seul', '7,00'],
      ['Menu', '8,50'],
    ],
    file: 'bowl-gourmand-de-frites-kebab-et-poulet-croustillant',
    alt: 'Bowl de frites, kebab et poulet croustillant',
    description: 'Frites, kebab et poulet croustillant.',
    cutout: true,
    featured: true,
  },
  {
    slug: 'crousty-riz',
    name: 'Crousty riz',
    category: 'bowls',
    prices: [
      ['Seul', '7,00'],
      ['Menu', '8,50'],
    ],
    file: 'crousty-riz-au-poulet-croustillant',
    alt: 'Crousty riz au poulet croustillant',
    description: 'Riz et poulet croustillant.',
    cutout: true,
    featured: true,
  },
  {
    slug: 'barquette-kebab',
    name: 'Barquette kebab',
    category: 'accompagnements',
    prices: [
      ['Moyenne', '7,00'],
      ['Grande', '10,00'],
    ],
    file: 'barquette-noire-de-kebab-roti',
    alt: 'Barquette noire de kebab rôti',
    cutout: true,
  },
  {
    slug: 'barquette-nuggets',
    name: 'Barquette nuggets',
    category: 'accompagnements',
    prices: [
      ['5 pièces', '3,00'],
      ['10 pièces', '6,00'],
    ],
  },
  {
    slug: 'barquette-tenders',
    name: 'Barquette tenders',
    category: 'accompagnements',
    prices: [
      ['5 pièces', '7,50'],
      ['10 pièces', '15,00'],
    ],
  },
  {
    slug: 'barquette-wings',
    name: 'Barquette wings',
    category: 'accompagnements',
    prices: [
      ['5 pièces', '3,50'],
      ['10 pièces', '7,00'],
    ],
  },
  {
    slug: 'frites',
    name: 'Frites',
    category: 'accompagnements',
    prices: [
      ['Moyennes', '1,50'],
      ['Grandes', '2,50'],
    ],
    file: 'frites-dorees-en-barquette-noire',
    alt: 'Frites dorées en barquette noire',
    cutout: true,
  },
  {
    slug: 'naan-nature',
    name: 'Naan nature',
    category: 'accompagnements',
    prices: [['', '1,00']],
    file: 'naans-grilles-sur-fond-anthracite',
    alt: 'Naans grillés sur fond anthracite',
    cutout: true,
  },
  { slug: 'naan-fromage', name: 'Naan fromage', category: 'accompagnements', prices: [['', '2,00']] },
  { slug: 'soda', name: 'Soda 33 cl', category: 'boissons', prices: [['', '2,00']] },
  { slug: 'eau', name: 'Eau 50 cl', category: 'boissons', prices: [['', '1,50']] },
  { slug: 'cafe', name: 'Café', category: 'boissons', prices: [['', '1,50']] },
  { slug: 'patisserie', name: 'Pâtisserie', category: 'boissons', prices: [['', '2,00']] },
  { slug: 'menu-enfant', name: 'Menu enfant', category: 'menu-enfant', prices: [['', '7,00']] },
]

const cents = (euros: string) => Math.round(Number(euros.replace(',', '.')) * 100)

const META_KEY = '_seeded'

async function alreadySeeded(): Promise<boolean> {
  return Boolean(await one('SELECT 1 FROM settings WHERE key = $1', [META_KEY]))
}

/**
 * Fills an empty database with the restaurant's categories, products and photographs.
 * Safe to re-run after an interruption: existing categories and products are skipped.
 */
export async function seedIfEmpty(log: (msg: string) => void = () => {}): Promise<boolean> {
  if (await alreadySeeded()) return false
  const photosDir = path.join(assetsDir(), 'photos')
  const cutoutsDir = path.join(assetsDir(), 'cutouts')
  if (!fs.existsSync(photosDir)) {
    log('Aucun dossier assets/photos : initialisation sans photos.')
  }

  for (const key of ['restaurant', 'hours', 'services', 'content'] as const) {
    if (!(await one('SELECT 1 FROM settings WHERE key = $1', [key]))) await setSetting(key, {})
  }

  for (const [i, c] of CATEGORIES.entries()) {
    await query(
      'INSERT INTO categories (slug, name, tagline, sort) VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO NOTHING',
      [c.slug, c.name, c.tagline, i + 1],
    )
  }
  const categoryId = async (slug: string) =>
    (await one<{ id: number }>('SELECT id FROM categories WHERE slug = $1', [slug]))!.id

  for (const [index, p] of PRODUCTS.entries()) {
    if (await one('SELECT 1 FROM products WHERE slug = $1', [p.slug])) continue
    const photoPath = p.file ? path.join(photosDir, `${p.file}.jpg`) : null
    const cutoutPath = p.file ? path.join(cutoutsDir, `${p.file}.webp`) : null
    const photo =
      photoPath && fs.existsSync(photoPath)
        ? await importImage(fs.readFileSync(photoPath), {
            kind: 'photo',
            alt: p.alt ?? p.name,
            originalName: `${p.file}.jpg`,
            inGallery: true,
          })
        : null
    const cutout =
      p.cutout && cutoutPath && fs.existsSync(cutoutPath)
        ? await importImage(fs.readFileSync(cutoutPath), {
            kind: 'cutout',
            alt: p.alt ?? p.name,
            originalName: `${p.file}.webp`,
          })
        : null
    const prices = p.prices.map(([label, euros]) => ({ label, cents: cents(euros) }))
    await query(
      `INSERT INTO products (slug, category_id, name, description, prices, photo_media_id, cutout_media_id, featured, sort)
       VALUES ($1, $2, $3, $4, $5::text::jsonb, $6, $7, $8, $9) ON CONFLICT (slug) DO NOTHING`,
      [
        p.slug,
        await categoryId(p.category),
        p.name,
        p.description ?? '',
        JSON.stringify(prices),
        photo?.id ?? null,
        cutout?.id ?? null,
        p.featured ?? false,
        index + 1,
      ],
    )
    log(`  ✓ ${p.name}`)
  }

  // Category covers: the first photographed product of each category.
  await query(`
    UPDATE categories SET cover_media_id = (
      SELECT photo_media_id FROM products WHERE category_id = categories.id AND photo_media_id IS NOT NULL
      ORDER BY sort LIMIT 1
    ) WHERE cover_media_id IS NULL`)

  await query('INSERT INTO settings (key, value) VALUES ($1, $2::text::jsonb) ON CONFLICT (key) DO NOTHING', [
    META_KEY,
    JSON.stringify({ at: new Date().toISOString() }),
  ])
  return true
}

/** Creates the first administrator from ADMIN_USERNAME / ADMIN_PASSWORD when no account exists. */
export async function ensureAdminFromEnv(log: (msg: string) => void = () => {}) {
  if ((await countUsers()) > 0) return
  const username = process.env.ADMIN_USERNAME?.trim()
  const password = process.env.ADMIN_PASSWORD
  if (!username || !password) {
    log('Aucun compte administrateur : définissez ADMIN_USERNAME et ADMIN_PASSWORD, ou lancez `npm run admin:create`.')
    return
  }
  await upsertUser(username, password)
  log(`Compte administrateur « ${username} » créé.`)
}
