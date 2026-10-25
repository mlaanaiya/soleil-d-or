'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { editMedia, moveInGallery, removeMedia } from '@/app/admin/_actions/media'
import type { ActionState } from '@/lib/action-state'
import { uploadFiles } from './MediaPicker'
import { Toast } from './Toast'

export type AdminMedia = { id: string; url: string; alt: string; kind: 'photo' | 'cutout'; inGallery: boolean; usage: number; size: string }

function Dropzone({ kind, onDone }: { kind: 'photo' | 'cutout'; onDone: (s: ActionState) => void }) {
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const send = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    const { created, errors } = await uploadFiles(files, kind, kind === 'photo')
    setBusy(false)
    onDone({
      ok: errors.length === 0,
      message: [created.length ? `${created.length} image(s) importée(s).` : '', ...errors].filter(Boolean).join(' '),
      at: Date.now(),
    })
  }
  return (
    <label
      className="adm-dropzone"
      data-over={over}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        void send(e.dataTransfer.files)
      }}
    >
      <strong>{busy ? 'Import en cours… (quelques secondes par photo)' : kind === 'photo' ? 'Déposez vos photos ici' : 'Déposez vos détourages ici'}</strong>
      <small>
        {kind === 'photo'
          ? 'ou cliquez pour choisir · JPEG, PNG, WebP, AVIF · 15 Mo max · idéalement 2000 px de large ou plus'
          : 'PNG ou WebP avec fond transparent'}
      </small>
      <input
        type="file"
        multiple
        hidden
        accept={kind === 'photo' ? 'image/jpeg,image/png,image/webp,image/avif' : 'image/png,image/webp'}
        onChange={(e) => {
          void send(e.target.files)
          e.target.value = ''
        }}
        disabled={busy}
      />
    </label>
  )
}

export function MediaLibrary({ photos, cutouts }: { photos: AdminMedia[]; cutouts: AdminMedia[] }) {
  const router = useRouter()
  const [state, setState] = useState<ActionState | null>(null)
  const [pending, start] = useTransition()
  const run = (fn: () => Promise<ActionState>) =>
    start(async () => {
      setState(await fn())
      router.refresh()
    })
  const done = (s: ActionState) => {
    setState(s)
    router.refresh()
  }
  const gallery = photos.filter((p) => p.inGallery)

  const card = (m: AdminMedia) => (
    <div className="adm-media" data-kind={m.kind} key={m.id}>
      <div className="adm-media-img">
        {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
        <img src={m.url} alt={m.alt} loading="lazy" />
      </div>
      <input
        className="adm-input"
        type="text"
        defaultValue={m.alt}
        maxLength={200}
        aria-label="Description de l’image (accessibilité et référencement)"
        placeholder="Description de l’image"
        onBlur={(e) => e.target.value !== m.alt && run(() => editMedia(m.id, { alt: e.target.value }))}
      />
      {m.kind === 'photo' && (
        <label className="adm-switch">
          <input type="checkbox" checked={m.inGallery} disabled={pending} onChange={(e) => run(() => editMedia(m.id, { inGallery: e.target.checked }))} />
          Dans la galerie
        </label>
      )}
      <div className="adm-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <small className="adm-sub" style={{ marginTop: 0 }}>
          {m.usage > 0 ? `Utilisée ${m.usage}×` : 'Non utilisée'} · {m.size}
        </small>
        <button
          type="button"
          className="adm-btn adm-btn--small adm-btn--danger"
          disabled={pending || m.usage > 0}
          title={m.usage > 0 ? 'Utilisée par un produit ou une catégorie' : undefined}
          onClick={() => window.confirm('Supprimer définitivement cette image ?') && run(() => removeMedia(m.id))}
        >
          Supprimer
        </button>
      </div>
    </div>
  )

  return (
    <>
      <section className="adm-card">
        <h2>Ordre de la galerie</h2>
        <p className="adm-card-sub">Les photos cochées « Dans la galerie » apparaissent sur la page Galerie et l’accueil, dans cet ordre.</p>
        {gallery.length === 0 ? (
          <p className="adm-empty">Aucune photo dans la galerie.</p>
        ) : (
          <div className="adm-media-grid">
            {gallery.map((m, i) => (
              <div className="adm-media" data-kind="photo" key={m.id}>
                <div className="adm-media-img">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
                  <img src={m.url} alt={m.alt} loading="lazy" />
                </div>
                <div className="adm-row" style={{ justifyContent: 'space-between' }}>
                  <strong>{i + 1}</strong>
                  <div>
                    <button type="button" className="adm-icon-btn" disabled={i === 0 || pending} onClick={() => run(() => moveInGallery(m.id, -1))} aria-label="Avancer">
                      ←
                    </button>
                    <button type="button" className="adm-icon-btn" disabled={i === gallery.length - 1 || pending} onClick={() => run(() => moveInGallery(m.id, 1))} aria-label="Reculer">
                      →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="adm-card">
        <h2>Photos ({photos.length})</h2>
        <p className="adm-card-sub">Chaque photo est automatiquement optimisée (formats AVIF et WebP, plusieurs tailles).</p>
        <Dropzone kind="photo" onDone={done} />
        <div className="adm-media-grid" style={{ marginTop: 16 }}>
          {photos.map(card)}
        </div>
      </section>

      <section className="adm-card">
        <h2>Détourages ({cutouts.length})</h2>
        <p className="adm-card-sub">Images sans fond, utilisées pour les mises en scène (ouverture de l’accueil, fiches produits).</p>
        <Dropzone kind="cutout" onDone={done} />
        <div className="adm-media-grid" style={{ marginTop: 16 }}>
          {cutouts.map(card)}
        </div>
      </section>
      <Toast state={state} />
    </>
  )
}
