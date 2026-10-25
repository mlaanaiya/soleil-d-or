'use client'

import { useState, useTransition } from 'react'
import { moveCategory, removeCategory, saveCategory } from '@/app/admin/_actions/catalog'
import type { ActionState } from '@/lib/action-state'
import { MediaPicker, type LibraryItem } from './MediaPicker'
import { Toast } from './Toast'
import { useAdminForm } from './useAdminForm'

export type AdminCategory = {
  id: number | null
  name: string
  slug: string
  tagline: string
  description: string
  coverMediaId: string | null
  visible: boolean
  count: number
}

export function CategoryEditor({ category, photos, first, last }: { category: AdminCategory; photos: LibraryItem[]; first?: boolean; last?: boolean }) {
  const [state, onSubmit, pending] = useAdminForm(saveCategory)
  const [other, setOther] = useState<ActionState | null>(null)
  const [busy, start] = useTransition()
  const run = (fn: () => Promise<ActionState>) => start(async () => setOther(await fn()))

  return (
    <section className="adm-card">
      <form onSubmit={onSubmit} className="adm-form" key={category.id ? undefined : state.at}>
        {category.id && <input type="hidden" name="id" value={category.id} />}
        <div className="adm-row" style={{ justifyContent: 'space-between' }}>
          <h2>{category.id ? category.name : 'Nouvelle catégorie'}</h2>
          {category.id && (
            <div className="adm-row" style={{ gap: 4 }}>
              <span className="adm-sub" style={{ marginTop: 0 }}>
                {category.count} produit{category.count > 1 ? 's' : ''}
              </span>
              <button type="button" className="adm-icon-btn" disabled={first || busy} onClick={() => run(() => moveCategory(category.id!, -1))} aria-label={`Monter ${category.name}`}>
                ↑
              </button>
              <button type="button" className="adm-icon-btn" disabled={last || busy} onClick={() => run(() => moveCategory(category.id!, 1))} aria-label={`Descendre ${category.name}`}>
                ↓
              </button>
            </div>
          )}
        </div>
        <div className="adm-grid-3">
          <label className="adm-field">
            <span>Nom</span>
            <input name="name" required maxLength={60} defaultValue={category.name} />
          </label>
          <label className="adm-field">
            <span>
              Accroche <small>— courte phrase</small>
            </span>
            <input name="tagline" maxLength={120} defaultValue={category.tagline} />
          </label>
          <label className="adm-field">
            <span>
              Adresse <small>— /carte#…</small>
            </span>
            <input name="slug" maxLength={80} defaultValue={category.slug} placeholder="générée depuis le nom" />
          </label>
        </div>
        <label className="adm-field">
          <span>
            Description <small>— facultatif, affichée en tête de la catégorie sur la carte</small>
          </span>
          <textarea name="description" maxLength={600} defaultValue={category.description} />
        </label>
        <div className="adm-grid-2">
          <MediaPicker name="coverMediaId" kind="photo" label="Photo de couverture" help="utilisée sur l’accueil" value={category.coverMediaId} library={photos} />
          <label className="adm-switch">
            <input type="checkbox" name="visible" defaultChecked={category.visible} />
            <span>
              Visible sur le site
              <small>Masquer une catégorie masque aussi tous ses produits.</small>
            </span>
          </label>
        </div>
        <div className="adm-row">
          <button type="submit" className="adm-btn adm-btn--primary" disabled={pending}>
            {pending ? 'Enregistrement…' : category.id ? 'Enregistrer' : 'Créer la catégorie'}
          </button>
          {category.id && (
            <button
              type="button"
              className="adm-btn adm-btn--danger"
              disabled={busy}
              onClick={() => window.confirm(`Supprimer la catégorie « ${category.name} » ?`) && run(() => removeCategory(category.id!))}
            >
              Supprimer
            </button>
          )}
        </div>
      </form>
      <Toast state={other ?? state} />
    </section>
  )
}
