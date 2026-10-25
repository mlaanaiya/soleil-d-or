'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { moveProduct, quickPrices, toggleProduct } from '@/app/admin/_actions/catalog'
import type { ActionState } from '@/lib/action-state'
import { Toast } from './Toast'

export type AdminProductRow = {
  id: number
  name: string
  slug: string
  categoryId: number
  thumb: string | null
  prices: Array<{ label: string; amount: string }>
  available: boolean
  featured: boolean
  visible: boolean
  badge: string
}
export type AdminCategoryGroup = { id: number; name: string; visible: boolean; products: AdminProductRow[] }

function PriceEditor({ row, onSaved }: { row: AdminProductRow; onSaved: (s: ActionState) => void }) {
  const [rows, setRows] = useState(row.prices.length ? row.prices : [{ label: '', amount: '' }])
  const [dirty, setDirty] = useState(false)
  const [pending, start] = useTransition()
  const update = (i: number, key: 'label' | 'amount', value: string) => {
    setRows((r) => r.map((x, j) => (j === i ? { ...x, [key]: value } : x)))
    setDirty(true)
  }
  const save = () =>
    start(async () => {
      const result = await quickPrices(row.id, rows)
      onSaved(result)
      if (result.ok) setDirty(false)
    })
  return (
    <div className="adm-prices">
      {rows.map((p, i) => (
        <div className="adm-price-row" key={i}>
          <input
            className="adm-input"
            name="label"
            placeholder={rows.length > 1 ? 'Formule (ex. Menu)' : 'Libellé (facultatif)'}
            value={p.label}
            onChange={(e) => update(i, 'label', e.target.value)}
            aria-label={`Libellé du prix ${i + 1} de ${row.name}`}
          />
          <input
            className="adm-input"
            name="amount"
            inputMode="decimal"
            placeholder="0,00"
            value={p.amount}
            onChange={(e) => update(i, 'amount', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            aria-label={`Prix ${i + 1} de ${row.name} en euros`}
          />
          <span className="adm-euro">€</span>
          {rows.length > 1 && (
            <button
              type="button"
              className="adm-icon-btn"
              onClick={() => {
                setRows((r) => r.filter((_, j) => j !== i))
                setDirty(true)
              }}
              aria-label="Retirer ce prix"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <div className="adm-row" style={{ gap: 6 }}>
        <button type="button" className="adm-btn adm-btn--small" onClick={() => setRows((r) => [...r, { label: '', amount: '' }])}>
          + Formule
        </button>
        {dirty && (
          <button type="button" className="adm-btn adm-btn--small adm-btn--primary" onClick={save} disabled={pending}>
            {pending ? '…' : 'Enregistrer le prix'}
          </button>
        )}
      </div>
    </div>
  )
}

export function ProductRows({ groups, onlyMissing }: { groups: AdminCategoryGroup[]; onlyMissing: boolean }) {
  const [query, setQuery] = useState('')
  const [missing, setMissing] = useState(onlyMissing)
  const [state, setState] = useState<ActionState | null>(null)
  const [pending, start] = useTransition()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return groups
      .map((g) => ({
        ...g,
        products: g.products.filter(
          (p) => (!q || p.name.toLowerCase().includes(q)) && (!missing || p.prices.length === 0),
        ),
      }))
      .filter((g) => g.products.length > 0 || (!q && !missing))
  }, [groups, query, missing])

  const run = (fn: () => Promise<ActionState>) => start(async () => setState(await fn()))

  return (
    <>
      <div className="adm-toolbar">
        <input
          className="adm-input"
          type="search"
          placeholder="Rechercher un produit…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Rechercher un produit"
        />
        <label className="adm-switch">
          <input type="checkbox" checked={missing} onChange={(e) => setMissing(e.target.checked)} />
          Seulement les produits sans prix
        </label>
      </div>

      {filtered.map((g) => (
        <section key={g.id} className="adm-cat-block">
          <div className="adm-cat-title">
            <h2>{g.name}</h2>
            <span>
              {g.products.length} produit{g.products.length > 1 ? 's' : ''}
              {!g.visible && ' · catégorie masquée'}
            </span>
          </div>
          {g.products.length === 0 ? (
            <p className="adm-empty">
              Aucun produit. <Link href={`/admin/produits/nouveau?categorie=${g.id}`}>Ajouter un produit</Link>
            </p>
          ) : (
            <div className="adm-plist">
              {g.products.map((p, i) => (
                <div key={p.id} className="adm-prow" data-hidden={!p.visible}>
                  <div className="adm-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnails come from the media route */}
                    {p.thumb && <img src={p.thumb} alt="" loading="lazy" />}
                  </div>
                  <div className="adm-pname">
                    <Link href={`/admin/produits/${p.id}`}>{p.name}</Link>
                    <div className="adm-tags">
                      {!p.visible && <span className="adm-tag">Masqué du site</span>}
                      {p.badge && <span className="adm-tag" data-tone="sun">{p.badge}</span>}
                      {p.prices.length === 0 && <span className="adm-tag" data-tone="off">Sans prix</span>}
                    </div>
                  </div>
                  <PriceEditor row={p} onSaved={setState} />
                  <div className="adm-flags">
                    <button
                      type="button"
                      className="adm-flag"
                      data-kind="available"
                      aria-pressed={p.available}
                      disabled={pending}
                      onClick={() => run(() => toggleProduct(p.id, 'available', !p.available))}
                      title="Disponibilité affichée sur le site"
                    >
                      {p.available ? 'Disponible' : 'Indisponible'}
                    </button>
                    <button
                      type="button"
                      className="adm-flag"
                      data-kind="featured"
                      aria-pressed={p.featured}
                      disabled={pending}
                      onClick={() => run(() => toggleProduct(p.id, 'featured', !p.featured))}
                      title="Mis en avant sur l’accueil"
                    >
                      {p.featured ? '★ À la une' : '☆ À la une'}
                    </button>
                  </div>
                  <div className="adm-order-btns">
                    <button type="button" className="adm-icon-btn" disabled={i === 0 || pending} onClick={() => run(() => moveProduct(p.id, -1))} aria-label={`Monter ${p.name}`}>
                      ↑
                    </button>
                    <button
                      type="button"
                      className="adm-icon-btn"
                      disabled={i === g.products.length - 1 || pending}
                      onClick={() => run(() => moveProduct(p.id, 1))}
                      aria-label={`Descendre ${p.name}`}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
      <Toast state={state} />
    </>
  )
}
