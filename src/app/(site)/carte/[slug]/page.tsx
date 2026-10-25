import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AddToCart } from '@/components/order/AddToCart'
import { ProductStage } from '@/components/product/ProductStage'
import { ProductTile } from '@/components/product/ProductTile'
import { JsonLd } from '@/components/seo/JsonLd'
import { mediaUrl } from '@/components/ui/Picture'
import { SunlitPicture } from '@/components/ui/SunlitPicture'
import { telHref } from '@/lib/format'
import { getAdjacent, getPublicProductBySlug, getSuggestions } from '@/lib/server/catalog'
import { loadSite } from '@/lib/server/public'
import { siteUrl } from '@/lib/site'
import { summarize } from '@/lib/summary'
import styles from './product.module.css'

export async function generateMetadata(props: PageProps<'/carte/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params
  const site = await loadSite()
  const product = await getPublicProductBySlug(slug)
  if (!product) return { title: `Produit introuvable — ${site.restaurant.name}` }
  const description = product.description || `${product.name}, à découvrir sur la carte de ${site.restaurant.name}.`
  const image = product.photo ? `/media/${product.photo.id}/og.jpg` : undefined
  return {
    title: `${product.name} — ${product.categoryName} | ${site.restaurant.name}`,
    description,
    alternates: { canonical: `/carte/${product.slug}` },
    openGraph: {
      type: 'website',
      title: `${product.name} — ${site.restaurant.name}`,
      description,
      images: image ? [{ url: image, width: 1200, height: 630, alt: product.photo!.alt }] : undefined,
    },
  }
}

export default async function ProductPage(props: PageProps<'/carte/[slug]'>) {
  const { slug } = await props.params
  const site = await loadSite()
  const product = await getPublicProductBySlug(slug)
  if (!product) notFound()

  const summary = summarize(product)
  const suggestions = (await getSuggestions(product, 3)).map(summarize)
  const { prev, next } = await getAdjacent(product)
  const orderable = site.canOrderOnline && product.available && product.prices.length > 0

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MenuItem',
    name: product.name,
    description: product.description || undefined,
    url: `${siteUrl()}/carte/${product.slug}`,
    image: product.photo ? `${siteUrl()}${mediaUrl(product.photo, 1200)}` : undefined,
    offers:
      product.prices.length > 0
        ? product.prices.map((p) => ({
            '@type': 'Offer',
            name: p.label || undefined,
            price: (p.cents / 100).toFixed(2),
            priceCurrency: 'EUR',
            availability: product.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          }))
        : undefined,
  }

  return (
    <article className={styles.page}>
      <JsonLd data={jsonLd} />
      <section className={`container ${styles.stage}`}>
        <div className={styles.info}>
          <nav className={styles.crumbs} aria-label="Fil d’Ariane">
            <Link href="/carte">La carte</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/carte#${product.categorySlug}`}>{product.categoryName}</Link>
          </nav>
          <h1 className={styles.name}>
            <span className={styles.nameMask}>
              <span>{product.name}</span>
            </span>
          </h1>
          {product.description && <p className={styles.desc}>{product.description}</p>}

          <div className={styles.priceBlock}>
            {product.prices.length === 0 ? (
              <p className={styles.priceMissing}>Prix communiqué au restaurant</p>
            ) : (
              <dl className={styles.prices}>
                {summary.prices.map((p, i) => (
                  <div key={i}>
                    <dt>{p.label || (product.prices.length > 1 ? `Option ${i + 1}` : 'Prix')}</dt>
                    <dd>{p.price}</dd>
                  </div>
                ))}
              </dl>
            )}
            <p className={styles.status} data-available={product.available}>
              <span className={styles.statusDot} />
              {product.available ? 'Disponible' : 'Momentanément indisponible'}
            </p>
            {product.badge && <span className={styles.badge}>{product.badge}</span>}
          </div>

          <div className={styles.ctas}>
            {orderable ? (
              <AddToCart productId={product.id} prices={summary.prices} />
            ) : (
              <>
                {site.canOrder && (
                  <Link href="/commander" className="btn">
                    Commander
                    <span className="btn-dot" aria-hidden="true" />
                  </Link>
                )}
                {site.restaurant.phone && (
                  <a href={telHref(site.restaurant.phone)} className={site.canOrder ? 'btn btn--ghost' : 'btn'}>
                    Appeler le restaurant
                  </a>
                )}
                <Link href="/contact" className="btn btn--ghost">
                  Nous trouver
                </Link>
              </>
            )}
          </div>
        </div>

        <div className={styles.visual}>
          <ProductStage cutout={product.cutout} photo={product.photo} name={product.name} />
        </div>
      </section>

      {product.cutout && product.photo && (
        <section className={styles.full} aria-label="Photographie">
          <figure className={styles.fullFigure} data-reveal="sun">
            <SunlitPicture media={product.photo} sizes="100vw" className={styles.fullPic} />
            <figcaption className={styles.fullCaption}>
              <span className="serif">{product.name}</span>, tel que servi.
            </figcaption>
          </figure>
        </section>
      )}

      {product.details && (
        <section className={`container ${styles.details}`}>
          <h2 className="eyebrow">Composition & informations</h2>
          <p className={styles.detailsText}>{product.details}</p>
        </section>
      )}

      {suggestions.length > 0 && (
        <section className={`container ${styles.suggest}`} aria-labelledby="suggest-title">
          <h2 id="suggest-title" className={styles.suggestTitle}>
            À goûter <span className="serif sun-text">aussi</span>
          </h2>
          <ul className={styles.suggestGrid}>
            {suggestions.map((s) => (
              <li key={s.slug}>
                <ProductTile product={s} sizes="(max-width: 760px) 90vw, 30vw" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {prev && next && (
        <nav className={`container ${styles.pager}`} aria-label="Produits voisins">
          <Link href={`/carte/${prev.slug}`} className={styles.pagerLink}>
            <span className={styles.pagerLabel}>← Précédent</span>
            <span className={styles.pagerName}>{prev.name}</span>
          </Link>
          <Link href={`/carte/${next.slug}`} className={`${styles.pagerLink} ${styles.pagerNext}`}>
            <span className={styles.pagerLabel}>Suivant →</span>
            <span className={styles.pagerName}>{next.name}</span>
          </Link>
        </nav>
      )}
    </article>
  )
}
