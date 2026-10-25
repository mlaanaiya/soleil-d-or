'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Picture } from '@/components/ui/Picture'
import { useLenis } from '@/components/motion/MotionProvider'
import type { ProductSummary } from '@/lib/summary'
import styles from './MenuBoard.module.css'

export type MenuCategory = {
  slug: string
  name: string
  tagline: string
  description: string
  products: ProductSummary[]
}

type View = 'photos' | 'liste'
const VIEW_KEY = 'sdo:menu-view'

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

function PriceTag({ product }: { product: ProductSummary }) {
  if (product.prices.length === 0) return <span className={styles.priceMissing}>Prix sur place</span>
  if (product.prices.length === 1) return <span className={styles.price}>{product.prices[0]!.price}</span>
  return <span className={styles.price}>{product.price}</span>
}

function Variants({ product }: { product: ProductSummary }) {
  if (product.prices.length < 2) return null
  return (
    <ul className={styles.variants}>
      {product.prices.map((p, i) => (
        <li key={i}>
          <span>{p.label || `Option ${i + 1}`}</span>
          <span className={styles.variantPrice}>{p.price}</span>
        </li>
      ))}
    </ul>
  )
}

function Tags({ product }: { product: ProductSummary }) {
  if (!product.badge && product.available) return null
  return (
    <span className={styles.tags}>
      {product.badge && <span className={styles.badge}>{product.badge}</span>}
      {!product.available && <span className={styles.off}>Indisponible</span>}
    </span>
  )
}

function PhotoItem({ product, feature }: { product: ProductSummary; feature: boolean }) {
  return (
    <li className={styles.item} data-feature={feature} data-unavailable={!product.available}>
      <Link href={`/carte/${product.slug}`} className={styles.itemLink}>
        <div className={styles.itemMedia}>
          {product.photo ? (
            <Picture
              media={product.photo}
              sizes={feature ? '(max-width: 760px) 120px, 60vw' : '(max-width: 760px) 120px, 30vw'}
              className={styles.itemPic}
              alt=""
            />
          ) : (
            <div className={styles.noPhoto} aria-hidden="true">
              <span>{product.name.charAt(0)}</span>
            </div>
          )}
          <span className={styles.itemHalo} aria-hidden="true" />
        </div>
        <div className={styles.itemBody}>
          <div className={styles.itemHead}>
            <h3 className={styles.itemName}>{product.name}</h3>
            <span className={styles.leader} aria-hidden="true" />
            <PriceTag product={product} />
          </div>
          {product.description && <p className={styles.itemDesc}>{product.description}</p>}
          <Variants product={product} />
          <Tags product={product} />
        </div>
      </Link>
    </li>
  )
}

function ListItem({ product }: { product: ProductSummary }) {
  return (
    <li className={styles.row} data-unavailable={!product.available}>
      <Link href={`/carte/${product.slug}`} className={styles.rowLink}>
        <div className={styles.itemHead}>
          <h3 className={styles.rowName}>{product.name}</h3>
          <span className={styles.leader} aria-hidden="true" />
          <PriceTag product={product} />
        </div>
        {product.description && <p className={styles.rowDesc}>{product.description}</p>}
        <Variants product={product} />
        <Tags product={product} />
      </Link>
    </li>
  )
}

export function MenuBoard({ categories }: { categories: MenuCategory[] }) {
  const lenis = useLenis()
  const [query, setQuery] = useState('')
  const [view, setView] = useState<View>('photos')
  const [active, setActive] = useState(categories[0]?.slug ?? '')
  const tabs = useRef<HTMLDivElement>(null)
  const indicator = useRef<HTMLSpanElement>(null)
  const toolbar = useRef<HTMLDivElement>(null)

  // Restore the preferred view (per-visitor convenience only).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage after hydration
      if (saved === 'photos' || saved === 'liste') setView(saved)
    } catch {
      /* storage unavailable */
    }
  }, [])
  const changeView = (v: View) => {
    setView(v)
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {
      /* storage unavailable */
    }
  }

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return categories
    return categories
      .map((c) => ({
        ...c,
        products: c.products.filter((p) => normalize(`${p.name} ${p.description} ${c.name}`).includes(q)),
      }))
      .filter((c) => c.products.length > 0)
  }, [categories, query])

  // Track the category currently under the toolbar.
  useEffect(() => {
    const sections = filtered
      .map((c) => document.getElementById(c.slug))
      .filter((el): el is HTMLElement => Boolean(el))
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-30% 0px -60% 0px' },
    )
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [filtered])

  // Slide the sun indicator under the active tab and keep that tab in view.
  useEffect(() => {
    const strip = tabs.current
    const tab = strip?.querySelector<HTMLElement>(`[data-slug="${active}"]`)
    if (!strip || !tab || !indicator.current) return
    indicator.current.style.transform = `translateX(${tab.offsetLeft}px)`
    indicator.current.style.width = `${tab.offsetWidth}px`
    const target = tab.offsetLeft - strip.clientWidth / 2 + tab.offsetWidth / 2
    strip.scrollTo({ left: target, behavior: 'smooth' })
  }, [active, filtered])

  const goTo = (slug: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    const el = document.getElementById(slug)
    if (!el) return
    const offset = -((toolbar.current?.offsetHeight ?? 0) + 24)
    if (lenis) lenis.scrollTo(el, { offset, duration: 1.2 })
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: 'smooth' })
    history.replaceState(null, '', `#${slug}`)
    setActive(slug)
  }

  const total = categories.reduce((n, c) => n + c.products.length, 0)

  return (
    <div className={styles.board} data-view={view}>
      <div ref={toolbar} className={styles.toolbar}>
        <div className={`container ${styles.toolbarInner}`}>
          <nav className={styles.tabsWrap} aria-label="Catégories de la carte">
            <div ref={tabs} className={styles.tabs}>
              {filtered.map((c) => (
                <a
                  key={c.slug}
                  href={`#${c.slug}`}
                  data-slug={c.slug}
                  className={styles.tab}
                  aria-current={active === c.slug ? 'true' : undefined}
                  onClick={goTo(c.slug)}
                >
                  {c.name}
                  <span className={styles.tabCount}>{c.products.length}</span>
                </a>
              ))}
              <span ref={indicator} className={styles.indicator} aria-hidden="true">
                <span className={styles.indicatorSun} />
              </span>
            </div>
          </nav>
          <div className={styles.tools}>
            <label className={styles.search}>
              <span className="visually-hidden">Rechercher un produit</span>
              <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" fill="none" />
                <path d="m13.5 13.5 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher…"
                autoComplete="off"
                enterKeyHint="search"
              />
            </label>
            <div className={styles.toggle} role="group" aria-label="Affichage de la carte">
              <button type="button" aria-pressed={view === 'photos'} onClick={() => changeView('photos')}>
                Photos
              </button>
              <button type="button" aria-pressed={view === 'liste'} onClick={() => changeView('liste')}>
                Liste rapide
              </button>
              <span className={styles.toggleThumb} aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <p className={styles.resultLine} aria-live="polite">
          {query.trim()
            ? `${filtered.reduce((n, c) => n + c.products.length, 0)} résultat(s) pour « ${query.trim()} »`
            : `${total} produits · ${categories.length} catégories`}
        </p>

        {filtered.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Aucun produit ne correspond.</p>
            <button type="button" className="btn btn--ghost" onClick={() => setQuery('')}>
              Effacer la recherche
            </button>
          </div>
        )}

        {filtered.map((c, ci) => {
          const featureIndex = c.products.findIndex((p) => p.photo)
          return (
            <section key={c.slug} id={c.slug} className={styles.category} aria-labelledby={`cat-${c.slug}`}>
              <header className={styles.catHead}>
                <span className={styles.catNum}>{String(ci + 1).padStart(2, '0')}</span>
                <h2 id={`cat-${c.slug}`} className={styles.catName}>
                  {c.name}
                </h2>
                {c.tagline && <p className={styles.catTagline}>{c.tagline}</p>}
                {c.description && <p className={styles.catDesc}>{c.description}</p>}
              </header>

              {c.products.length === 0 ? (
                <p className={styles.catEmpty}>Cette rubrique sera bientôt détaillée.</p>
              ) : view === 'photos' ? (
                <ul className={styles.grid} data-count={Math.min(c.products.length, 3)}>
                  {c.products.map((p, i) => (
                    <PhotoItem key={p.slug} product={p} feature={i === featureIndex && c.products.length > 2} />
                  ))}
                </ul>
              ) : (
                <ul className={styles.list}>
                  {c.products.map((p) => (
                    <ListItem key={p.slug} product={p} />
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
