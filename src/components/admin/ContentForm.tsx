'use client'

import { useState } from 'react'
import { saveContent } from '@/app/admin/_actions/settings'
import type { Content } from '@/lib/schemas'
import { Toast } from './Toast'
import { useAdminForm } from './useAdminForm'

type Option = { slug: string; name: string; hasCutout: boolean; hasPhoto: boolean }

function Field({
  name,
  label,
  help,
  value,
  max,
  area,
}: {
  name: keyof Content
  label: string
  help?: string
  value: string
  max: number
  area?: boolean
}) {
  return (
    <label className="adm-field">
      <span>
        {label} {help && <small>— {help}</small>}
      </span>
      {area ? (
        <textarea name={name} maxLength={max} defaultValue={value} />
      ) : (
        <input name={name} maxLength={max} defaultValue={value} />
      )}
    </label>
  )
}

function ProductSelect({
  name,
  values,
  options,
  count,
  filter,
}: {
  name: string
  values: string[]
  options: Option[]
  count: number
  filter: (o: Option) => boolean
}) {
  const list = options.filter(filter)
  return (
    <div className="adm-row">
      {Array.from({ length: count }, (_, i) => (
        <label className="adm-field" key={i}>
          <span>Position {i + 1}</span>
          <select name={name} defaultValue={values[i] ?? ''}>
            <option value="">— aucun —</option>
            {list.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  )
}

export function ContentForm({ initial, products }: { initial: Content; products: Option[] }) {
  const [state, onSubmit, pending] = useAdminForm(saveContent)
  const [chapters, setChapters] = useState(() => initial.chapters.map((c, i) => ({ ...c, id: i })))

  return (
    <form onSubmit={onSubmit} className="adm-form">
      <section className="adm-card adm-form">
        <div>
          <h2>Accueil — ouverture</h2>
          <p className="adm-card-sub">
            Le grand titre « Soleil d’Or » et les produits détourés qui défilent dans le premier écran.
          </p>
        </div>
        <div className="adm-grid-2">
          <Field name="heroKicker" label="Surtitre" value={initial.heroKicker} max={60} />
          <Field name="heroTagline" label="Phrase d’accroche" value={initial.heroTagline} max={140} />
        </div>
        <ProductSelect
          name="heroProducts"
          values={initial.heroProducts}
          options={products}
          count={4}
          filter={(o) => o.hasCutout}
        />
        <p className="adm-card-sub">Seuls les produits avec un détourage peuvent figurer dans l’ouverture.</p>
        <Field name="manifesto" label="Texte « L’univers »" value={initial.manifesto} max={600} area />
      </section>

      <section className="adm-card adm-form">
        <h2>Accueil — sections</h2>
        <div className="adm-grid-2">
          <Field name="featuredTitle" label="Titre « sélection »" value={initial.featuredTitle} max={80} />
          <Field
            name="featuredIntro"
            label="Texte « sélection »"
            help="produits cochés « À la une »"
            value={initial.featuredIntro}
            max={300}
          />
          <Field name="categoriesTitle" label="Titre « catégories »" value={initial.categoriesTitle} max={80} />
          <Field name="ctaTitle" label="Titre de l’appel final" value={initial.ctaTitle} max={80} />
          <Field name="spotlightTitle" label="Titre de la section à la une" value={initial.spotlightTitle} max={80} />
          <Field
            name="spotlightText"
            label="Texte de la section à la une"
            value={initial.spotlightText}
            max={500}
            area
          />
        </div>
        <ProductSelect
          name="spotlightProducts"
          values={initial.spotlightProducts}
          options={products}
          count={3}
          filter={(o) => o.hasPhoto}
        />
        <div className="adm-grid-2">
          <Field name="galleryTitle" label="Titre « galerie »" value={initial.galleryTitle} max={80} />
          <Field name="galleryIntro" label="Texte « galerie »" value={initial.galleryIntro} max={300} />
        </div>
      </section>

      <section className="adm-card adm-form">
        <h2>Page « Notre restaurant »</h2>
        <div className="adm-grid-2">
          <Field name="restaurantTitle" label="Titre" value={initial.restaurantTitle} max={80} />
          <Field name="restaurantIntro" label="Introduction" value={initial.restaurantIntro} max={600} area />
        </div>
        {chapters.map((c, i) => (
          <div className="adm-grid-2" key={c.id}>
            <label className="adm-field">
              <span>Chapitre {i + 1} — titre</span>
              <input name="chapterTitle" maxLength={80} defaultValue={c.title} />
            </label>
            <label className="adm-field">
              <span>
                Texte{' '}
                <button
                  type="button"
                  className="adm-btn adm-btn--small adm-btn--danger"
                  onClick={() => setChapters((x) => x.filter((y) => y.id !== c.id))}
                >
                  Retirer
                </button>
              </span>
              <textarea name="chapterText" maxLength={1200} defaultValue={c.text} />
            </label>
          </div>
        ))}
        <div>
          <button
            type="button"
            className="adm-btn adm-btn--small"
            disabled={chapters.length >= 6}
            onClick={() =>
              setChapters((x) => [...x, { title: '', text: '', id: Math.max(-1, ...x.map((y) => y.id)) + 1 }])
            }
          >
            + Ajouter un chapitre
          </button>
        </div>
      </section>

      <section className="adm-card adm-form" id="legal">
        <h2>Contact, référencement & mentions légales</h2>
        <Field name="contactIntro" label="Introduction de la page Contact" value={initial.contactIntro} max={400} />
        <Field
          name="seoDescription"
          label="Description pour Google"
          help="160 caractères environ"
          value={initial.seoDescription}
          max={170}
        />
        <Field
          name="legalNotice"
          label="Mentions légales"
          help="raison sociale, forme juridique, adresse du siège, SIRET, responsable de publication, hébergeur…"
          value={initial.legalNotice}
          max={6000}
          area
        />
      </section>

      <div className="adm-actions">
        <button type="submit" className="adm-btn adm-btn--primary" disabled={pending}>
          {pending ? 'Enregistrement…' : 'Enregistrer les textes'}
        </button>
      </div>
      <Toast state={state} />
    </form>
  )
}
