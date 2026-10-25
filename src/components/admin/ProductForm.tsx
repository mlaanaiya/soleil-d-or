'use client'

import { useState, useTransition } from 'react'
import { removeProduct, saveProduct } from '@/app/admin/_actions/catalog'
import { slugify } from '@/lib/format'
import type { ActionState } from '@/lib/action-state'
import { MediaPicker, type LibraryItem } from './MediaPicker'
import { Toast } from './Toast'
import { useAdminForm } from './useAdminForm'

export type ProductFormValues = {
  id: number | null
  name: string
  slug: string
  categoryId: number
  description: string
  details: string
  prices: Array<{ label: string; amount: string }>
  photoMediaId: string | null
  cutoutMediaId: string | null
  available: boolean
  visible: boolean
  featured: boolean
  badge: string
}

type Props = {
  values: ProductFormValues
  categories: Array<{ id: number; name: string }>
  photos: LibraryItem[]
  cutouts: LibraryItem[]
}

export function ProductForm({ values, categories, photos, cutouts }: Props) {
  const [state, onSubmit, pending] = useAdminForm(saveProduct)
  const [name, setName] = useState(values.name)
  const [slug, setSlug] = useState(values.slug)
  const [slugTouched, setSlugTouched] = useState(Boolean(values.id))
  const [prices, setPrices] = useState(values.prices.length ? values.prices : [{ label: '', amount: '' }])
  const [deleting, startDelete] = useTransition()
  const [deleteState, setDeleteState] = useState<ActionState | null>(null)

  return (
    <form onSubmit={onSubmit} className="adm-form">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <section className="adm-card">
        <h2>L’essentiel</h2>
        <p className="adm-card-sub">Ce qui apparaît sur la carte.</p>
        <div className="adm-form">
          <div className="adm-grid-2">
            <label className="adm-field">
              <span>Nom du produit</span>
              <input
                name="name"
                required
                maxLength={80}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (!slugTouched) setSlug(slugify(e.target.value))
                }}
                aria-invalid={Boolean(state.errors?.name)}
              />
            </label>
            <label className="adm-field">
              <span>Catégorie</span>
              <select name="categoryId" defaultValue={values.categoryId}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="adm-field">
            <span>
              Description <small>— une ou deux phrases, affichées sur la carte et la fiche produit.</small>
            </span>
            <textarea name="description" maxLength={600} defaultValue={values.description} />
          </label>

          <div className="adm-field">
            <span>
              Prix{' '}
              <small>
                — un seul prix, ou plusieurs formules (ex. « Seul », « Menu »). Laissez vide si le prix n’est pas encore
                fixé.
              </small>
            </span>
            <div className="adm-prices">
              {prices.map((p, i) => (
                <div className="adm-price-row" key={i}>
                  <input
                    className="adm-input"
                    name="priceLabel"
                    placeholder={prices.length > 1 ? 'Formule (ex. Menu)' : 'Libellé (facultatif)'}
                    value={p.label}
                    onChange={(e) => setPrices((r) => r.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                    aria-label={`Libellé du prix ${i + 1}`}
                  />
                  <input
                    className="adm-input"
                    name="priceAmount"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={p.amount}
                    onChange={(e) =>
                      setPrices((r) => r.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))
                    }
                    aria-label={`Montant du prix ${i + 1} en euros`}
                  />
                  <span className="adm-euro">€</span>
                  {prices.length > 1 && (
                    <button
                      type="button"
                      className="adm-icon-btn"
                      onClick={() => setPrices((r) => r.filter((_, j) => j !== i))}
                      aria-label="Retirer ce prix"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <div>
                <button
                  type="button"
                  className="adm-btn adm-btn--small"
                  onClick={() => setPrices((r) => [...r, { label: '', amount: '' }])}
                  disabled={prices.length >= 6}
                >
                  + Ajouter une formule
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="adm-card">
        <h2>Photos</h2>
        <p className="adm-card-sub">
          La photo apparaît sur la carte et la galerie ; le détourage (PNG transparent) sert aux mises en scène sur fond
          de soleil.
        </p>
        <div className="adm-grid-2">
          <MediaPicker
            name="photoMediaId"
            kind="photo"
            label="Photo"
            help="JPEG, PNG, WebP"
            value={values.photoMediaId}
            library={photos}
          />
          <MediaPicker
            name="cutoutMediaId"
            kind="cutout"
            label="Détourage"
            help="facultatif — PNG/WebP transparent"
            value={values.cutoutMediaId}
            library={cutouts}
          />
        </div>
      </section>

      <section className="adm-card">
        <h2>Affichage</h2>
        <div className="adm-grid-3">
          <label className="adm-switch">
            <input type="checkbox" name="available" defaultChecked={values.available} />
            <span>
              Disponible
              <small>Décochez en cas de rupture : le produit reste visible, marqué « indisponible ».</small>
            </span>
          </label>
          <label className="adm-switch">
            <input type="checkbox" name="featured" defaultChecked={values.featured} />
            <span>
              À la une
              <small>Affiché dans « Les incontournables » sur l’accueil.</small>
            </span>
          </label>
          <label className="adm-switch">
            <input type="checkbox" name="visible" defaultChecked={values.visible} />
            <span>
              Visible sur le site
              <small>Décochez pour masquer complètement le produit.</small>
            </span>
          </label>
        </div>
        <div className="adm-grid-2" style={{ marginTop: 16 }}>
          <label className="adm-field">
            <span>
              Badge <small>— facultatif, ex. « Nouveau ». Laissez vide pour aucun badge.</small>
            </span>
            <input name="badge" maxLength={24} defaultValue={values.badge} />
          </label>
          <label className="adm-field">
            <span>
              Adresse de la page <small>— /carte/…</small>
            </span>
            <input
              name="slug"
              maxLength={80}
              value={slug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(e.target.value)
              }}
              aria-invalid={Boolean(state.errors?.slug)}
            />
          </label>
        </div>
        <label className="adm-field" style={{ marginTop: 16 }}>
          <span>
            Composition, allergènes, informations <small>— facultatif, affiché sur la fiche produit.</small>
          </span>
          <textarea name="details" maxLength={600} defaultValue={values.details} />
        </label>
      </section>

      <div className="adm-actions">
        <button type="submit" className="adm-btn adm-btn--primary" disabled={pending}>
          {pending ? 'Enregistrement…' : values.id ? 'Enregistrer' : 'Créer le produit'}
        </button>
        {values.id && (
          <>
            <a className="adm-btn" href={`/carte/${values.slug}`} target="_blank" rel="noopener">
              Voir sur le site ↗
            </a>
            <button
              type="button"
              className="adm-btn adm-btn--danger"
              disabled={deleting}
              onClick={() => {
                if (!window.confirm(`Supprimer définitivement « ${values.name} » ?`)) return
                startDelete(async () => setDeleteState(await removeProduct(values.id!)))
              }}
            >
              Supprimer
            </button>
          </>
        )}
      </div>
      <Toast state={deleteState ?? state} />
    </form>
  )
}
