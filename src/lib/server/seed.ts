import 'server-only'
import fs from 'node:fs'
import path from 'node:path'
import { one, query } from './db'
import { importImage } from './media'
import { assetsDir } from './paths'
import { countUsers, upsertUser } from './security'
import { setSetting } from './settings'

/**
 * Initial catalogue built strictly from the restaurant's own photographs.
 * Names and short descriptions come from the photo titles supplied by the restaurant;
 * prices are intentionally left empty — they must be entered in the administration.
 */
const CATEGORIES = [
  { slug: 'sandwichs', name: 'Sandwichs', tagline: 'Dans le pain, tout le soleil.' },
  { slug: 'assiettes', name: 'Assiettes', tagline: 'Le grand format, servi à l’assiette.' },
  { slug: 'tacos', name: 'Tacos', tagline: 'Grillés, fondants, pliés.' },
  { slug: 'burgers', name: 'Burgers', tagline: 'Haut en couleur.' },
  { slug: 'crousty-riz', name: 'Crousty riz', tagline: 'Le croustillant sur lit de riz.' },
  { slug: 'bowls', name: 'Bowls', tagline: 'Tout dans le bol.' },
  { slug: 'accompagnements', name: 'Accompagnements', tagline: 'À côté, jamais en retrait.' },
  { slug: 'boissons', name: 'Boissons', tagline: 'Pour accompagner le soleil.' },
] as const

type SeedProduct = {
  file: string
  slug: string
  name: string
  category: (typeof CATEGORIES)[number]['slug']
  description: string
  alt: string
  cutout?: boolean
  featured?: boolean
}

const PRODUCTS: SeedProduct[] = [
  {
    file: 'kebab-francais-au-pain-turc-grille',
    slug: 'kebab-pain-turc',
    name: 'Kebab pain turc',
    category: 'sandwichs',
    description: 'Kebab à la française dans un pain turc grillé.',
    alt: 'Kebab français au pain turc grillé',
    cutout: true,
    featured: true,
  },
  {
    file: 'sandwich-naan-kebab-gourmand',
    slug: 'naan-kebab',
    name: 'Naan kebab',
    category: 'sandwichs',
    description: 'Sandwich kebab gourmand dans un pain naan.',
    alt: 'Sandwich naan kebab gourmand',
    cutout: true,
    featured: true,
  },
  {
    file: 'panini-grille-au-poulet-et-fromage',
    slug: 'panini-poulet-fromage',
    name: 'Panini poulet fromage',
    category: 'sandwichs',
    description: 'Panini grillé au poulet et au fromage.',
    alt: 'Panini grillé au poulet et fromage',
    cutout: true,
  },
  {
    file: 'assiette-grillee-frites-et-salade-fraiche',
    slug: 'assiette-grillee',
    name: 'Assiette grillée',
    category: 'assiettes',
    description: 'Assiette grillée, frites et salade fraîche.',
    alt: 'Assiette grillée, frites et salade fraîche',
    featured: true,
  },
  {
    file: 'cordon-bleu-frites-et-salade',
    slug: 'cordon-bleu',
    name: 'Cordon bleu',
    category: 'assiettes',
    description: 'Cordon bleu, frites et salade.',
    alt: 'Cordon bleu, frites et salade',
    featured: true,
  },
  {
    file: 'tenders-croustillants-frites-et-salade',
    slug: 'tenders',
    name: 'Tenders',
    category: 'assiettes',
    description: 'Tenders croustillants, frites et salade.',
    alt: 'Tenders croustillants, frites et salade',
  },
  {
    file: 'nuggets-croustillants-frites-et-salade-fraiche',
    slug: 'nuggets',
    name: 'Nuggets',
    category: 'assiettes',
    description: 'Nuggets croustillants, frites et salade fraîche.',
    alt: 'Nuggets croustillants, frites et salade fraîche',
  },
  {
    file: 'ailes-de-poulet-frites-et-salade',
    slug: 'ailes-de-poulet',
    name: 'Ailes de poulet',
    category: 'assiettes',
    description: 'Ailes de poulet, frites et salade.',
    alt: 'Ailes de poulet, frites et salade',
  },
  {
    file: 'poulet-grille-frites-et-salade',
    slug: 'poulet-grille',
    name: 'Poulet grillé',
    category: 'assiettes',
    description: 'Poulet grillé, frites et salade.',
    alt: 'Poulet grillé, frites et salade',
  },
  {
    file: 'steaks-grilles-frites-et-salade',
    slug: 'steaks-grilles',
    name: 'Steaks grillés',
    category: 'assiettes',
    description: 'Steaks grillés, frites et salade.',
    alt: 'Steaks grillés, frites et salade',
  },
  {
    file: 'koftas-grilles-frites-et-salade',
    slug: 'koftas',
    name: 'Koftas',
    category: 'assiettes',
    description: 'Koftas grillés, frites et salade.',
    alt: 'Koftas grillés, frites et salade',
  },
  {
    file: 'merguez-grillees-frites-et-salade',
    slug: 'merguez',
    name: 'Merguez',
    category: 'assiettes',
    description: 'Merguez grillées, frites et salade.',
    alt: 'Merguez grillées, frites et salade',
  },
  {
    file: 'falafels-dores-frites-et-salade-fraiche',
    slug: 'falafels',
    name: 'Falafels',
    category: 'assiettes',
    description: 'Falafels dorés, frites et salade fraîche.',
    alt: 'Falafels dorés, frites et salade fraîche',
  },
  {
    file: 'tacos-francais-grille-au-poulet-et-frites',
    slug: 'tacos-poulet',
    name: 'Tacos poulet',
    category: 'tacos',
    description: 'Tacos à la française grillé, au poulet et aux frites.',
    alt: 'Tacos français grillé au poulet et frites',
    cutout: true,
    featured: true,
  },
  {
    file: 'double-cheeseburger-gourmand-sur-fond-sombre',
    slug: 'double-cheeseburger',
    name: 'Double cheeseburger',
    category: 'burgers',
    description: 'Double cheeseburger gourmand.',
    alt: 'Double cheeseburger gourmand sur fond sombre',
    cutout: true,
    featured: true,
  },
  {
    file: 'crousty-riz-au-poulet-croustillant',
    slug: 'crousty-riz-poulet',
    name: 'Crousty riz poulet',
    category: 'crousty-riz',
    description: 'Riz et poulet croustillant.',
    alt: 'Crousty riz au poulet croustillant',
    cutout: true,
    featured: true,
  },
  {
    file: 'bowl-gourmand-de-frites-kebab-et-poulet-croustillant',
    slug: 'bowl-gourmand',
    name: 'Bowl gourmand',
    category: 'bowls',
    description: 'Bowl de frites, kebab et poulet croustillant.',
    alt: 'Bowl gourmand de frites, kebab et poulet croustillant',
    cutout: true,
    featured: true,
  },
  {
    file: 'salade-de-thon-fraiche-aux-legumes',
    slug: 'salade-thon',
    name: 'Salade de thon',
    category: 'bowls',
    description: 'Salade de thon fraîche aux légumes.',
    alt: 'Salade de thon fraîche aux légumes',
    cutout: true,
  },
  {
    file: 'frites-dorees-en-barquette-noire',
    slug: 'frites',
    name: 'Frites',
    category: 'accompagnements',
    description: 'Frites dorées en barquette.',
    alt: 'Frites dorées en barquette noire',
    cutout: true,
  },
  {
    file: 'naans-grilles-sur-fond-anthracite',
    slug: 'naans',
    name: 'Naans grillés',
    category: 'accompagnements',
    description: 'Pains naan grillés.',
    alt: 'Naans grillés sur fond anthracite',
    cutout: true,
  },
  {
    file: 'barquette-noire-de-kebab-roti',
    slug: 'barquette-kebab',
    name: 'Barquette kebab',
    category: 'accompagnements',
    description: 'Barquette de viande kebab rôtie.',
    alt: 'Barquette noire de kebab rôti',
    cutout: true,
  },
]

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
    const photoPath = path.join(photosDir, `${p.file}.jpg`)
    const cutoutPath = path.join(cutoutsDir, `${p.file}.webp`)
    const photo = fs.existsSync(photoPath)
      ? await importImage(fs.readFileSync(photoPath), {
          kind: 'photo',
          alt: p.alt,
          originalName: `${p.file}.jpg`,
          inGallery: true,
        })
      : null
    const cutout =
      p.cutout && fs.existsSync(cutoutPath)
        ? await importImage(fs.readFileSync(cutoutPath), { kind: 'cutout', alt: p.alt, originalName: `${p.file}.webp` })
        : null
    await query(
      `INSERT INTO products (slug, category_id, name, description, photo_media_id, cutout_media_id, featured, sort)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (slug) DO NOTHING`,
      [
        p.slug,
        await categoryId(p.category),
        p.name,
        p.description,
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
