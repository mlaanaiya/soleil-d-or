'use client'

import { useRef, useState } from 'react'

export type LibraryItem = { id: string; url: string; alt: string }

type Props = {
  name: string
  kind: 'photo' | 'cutout'
  label: string
  help: string
  value: string | null
  library: LibraryItem[]
}

/** Upload through the admin media route; returns the new library items. */
export async function uploadFiles(files: FileList | File[], kind: 'photo' | 'cutout', inGallery = false) {
  const body = new FormData()
  Array.from(files).forEach((f) => body.append('file', f))
  body.append('kind', kind)
  body.append('inGallery', String(inGallery))
  const res = await fetch('/api/admin/media', { method: 'POST', body })
  const data = (await res.json().catch(() => ({}))) as {
    created?: Array<{ id: string; alt: string; widths: number[] }>
    errors?: string[]
    error?: string
  }
  const created: LibraryItem[] = (data.created ?? []).map((m) => ({
    id: m.id,
    alt: m.alt,
    url: `/media/${m.id}/${m.widths.find((w) => w >= 400) ?? m.widths.at(-1)}.webp`,
  }))
  const errors = data.error ? [data.error] : (data.errors ?? [])
  return { created, errors }
}

export function MediaPicker({ name, kind, label, help, value, library }: Props) {
  const [selected, setSelected] = useState(value)
  const [items, setItems] = useState(library)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const current = items.find((i) => i.id === selected)

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    setError(null)
    const { created, errors } = await uploadFiles(files, kind, kind === 'photo')
    setBusy(false)
    if (created.length) {
      setItems((list) => [...created, ...list])
      setSelected(created[0]!.id)
      setOpen(false)
    }
    if (errors.length) setError(errors.join(' '))
  }

  return (
    <div className="adm-field">
      <span>
        {label} <small>{help}</small>
      </span>
      <input type="hidden" name={name} value={selected ?? ''} />
      <div className="adm-picker">
        <div className="adm-picker-preview">
          {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
          {current ? <img src={current.url} alt={current.alt} /> : <span>Aucune</span>}
        </div>
        <div className="adm-row" style={{ gap: 8 }}>
          <button type="button" className="adm-btn adm-btn--small" onClick={() => setOpen(true)}>
            Choisir…
          </button>
          <button
            type="button"
            className="adm-btn adm-btn--small"
            onClick={() => input.current?.click()}
            disabled={busy}
          >
            {busy ? 'Envoi…' : 'Envoyer une image'}
          </button>
          {selected && (
            <button type="button" className="adm-btn adm-btn--small adm-btn--danger" onClick={() => setSelected(null)}>
              Retirer
            </button>
          )}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept={kind === 'cutout' ? 'image/png,image/webp' : 'image/jpeg,image/png,image/webp,image/avif'}
        hidden
        onChange={(e) => {
          void onFiles(e.target.files)
          e.target.value = ''
        }}
      />
      {error && <p className="adm-error">{error}</p>}

      {open && (
        <div
          className="adm-modal"
          role="dialog"
          aria-modal="true"
          aria-label={label}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="adm-modal-card">
            <div className="adm-modal-head">
              <h2>{label}</h2>
              <button type="button" className="adm-btn adm-btn--small" onClick={() => setOpen(false)}>
                Fermer
              </button>
            </div>
            {items.length === 0 ? (
              <p className="adm-empty">Aucune image pour l’instant : utilisez « Envoyer une image ».</p>
            ) : (
              <div className="adm-media-grid">
                {items.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="adm-pick"
                    aria-pressed={m.id === selected}
                    onClick={() => {
                      setSelected(m.id)
                      setOpen(false)
                    }}
                    title={m.alt}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
                    <img src={m.url} alt={m.alt} loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
