'use client'

import { useRef, useState, useTransition } from 'react'
import { geocode, saveRestaurant, saveServices } from '@/app/admin/_actions/settings'
import type { Restaurant, Services } from '@/lib/schemas'
import { Toast } from './Toast'
import { useAdminForm } from './useAdminForm'

export function RestaurantForm({ initial }: { initial: Restaurant }) {
  const [state, onSubmit, pending] = useAdminForm(saveRestaurant)
  const form = useRef<HTMLFormElement>(null)
  const [lat, setLat] = useState(initial.lat?.toString() ?? '')
  const [lng, setLng] = useState(initial.lng?.toString() ?? '')
  const [geo, setGeo] = useState<string | null>(null)
  const [locating, startLocate] = useTransition()

  const locate = () => {
    const f = new FormData(form.current!)
    const address = ['street', 'postalCode', 'city'].map((k) => String(f.get(k) ?? '')).join(' ')
    startLocate(async () => {
      const r = await geocode(address)
      if (r.ok) {
        setLat(String(r.lat))
        setLng(String(r.lng))
        setGeo(`Position trouvée : ${r.label}. Vérifiez puis enregistrez.`)
      } else setGeo(r.error)
    })
  }

  return (
    <form ref={form} onSubmit={onSubmit} className="adm-card adm-form">
      <div>
        <h2>Coordonnées</h2>
        <p className="adm-card-sub">
          Affichées dans le pied de page, la page Contact et transmises à Google (données structurées).
        </p>
      </div>
      <label className="adm-field">
        <span>Nom du restaurant</span>
        <input name="name" required maxLength={80} defaultValue={initial.name} />
      </label>
      <div className="adm-grid-3">
        <label className="adm-field" style={{ gridColumn: 'span 1' }}>
          <span>Adresse (numéro et rue)</span>
          <input name="street" maxLength={160} defaultValue={initial.street} autoComplete="street-address" />
        </label>
        <label className="adm-field">
          <span>Code postal</span>
          <input name="postalCode" maxLength={12} defaultValue={initial.postalCode} inputMode="numeric" />
        </label>
        <label className="adm-field">
          <span>Ville</span>
          <input name="city" maxLength={80} defaultValue={initial.city} />
        </label>
      </div>
      <div className="adm-row">
        <label className="adm-field">
          <span>
            Latitude <small>— pour le plan et les itinéraires</small>
          </span>
          <input
            name="lat"
            inputMode="decimal"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="ex. 48.8566"
          />
        </label>
        <label className="adm-field">
          <span>Longitude</span>
          <input
            name="lng"
            inputMode="decimal"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="ex. 2.3522"
          />
        </label>
        <button type="button" className="adm-btn" onClick={locate} disabled={locating}>
          {locating ? 'Recherche…' : 'Trouver depuis l’adresse'}
        </button>
      </div>
      {geo && <p className="adm-alert">{geo}</p>}
      <div className="adm-grid-2">
        <label className="adm-field">
          <span>Téléphone</span>
          <input name="phone" type="tel" maxLength={30} defaultValue={initial.phone} />
        </label>
        <label className="adm-field">
          <span>
            E-mail <small>— facultatif</small>
          </span>
          <input name="email" type="email" maxLength={160} defaultValue={initial.email} />
        </label>
      </div>
      <div>
        <h2 style={{ marginTop: 8 }}>Réseaux sociaux</h2>
        <p className="adm-card-sub">
          Collez l’adresse complète de vos pages (https://…). Seuls les liens renseignés apparaissent.
        </p>
      </div>
      <div className="adm-grid-2">
        {(['instagram', 'facebook', 'tiktok', 'snapchat', 'google'] as const).map((k) => (
          <label className="adm-field" key={k}>
            <span>{k === 'google' ? 'Fiche Google' : k[0]!.toUpperCase() + k.slice(1)}</span>
            <input name={k} type="url" maxLength={500} defaultValue={initial.socials[k]} placeholder="https://" />
          </label>
        ))}
      </div>
      <div className="adm-actions">
        <button type="submit" className="adm-btn adm-btn--primary" disabled={pending}>
          {pending ? 'Enregistrement…' : 'Enregistrer les coordonnées'}
        </button>
      </div>
      <Toast state={state} />
    </form>
  )
}

export function ServicesForm({ initial }: { initial: Services }) {
  const [state, onSubmit, pending] = useAdminForm(saveServices)
  const [links, setLinks] = useState(() => initial.externalLinks.map((l, i) => ({ ...l, id: i })))
  const [ordering, setOrdering] = useState(initial.ordering.enabled)
  const [resa, setResa] = useState(initial.reservations.enabled)

  return (
    <form onSubmit={onSubmit} className="adm-card adm-form" id="services">
      <div>
        <h2>Services</h2>
        <p className="adm-card-sub">
          N’activez que ce qui est réellement proposé : le site n’affiche jamais un service désactivé.
        </p>
      </div>
      <div className="adm-grid-3">
        <label className="adm-switch">
          <input type="checkbox" name="dineIn" defaultChecked={initial.dineIn} /> Sur place
        </label>
        <label className="adm-switch">
          <input type="checkbox" name="takeaway" defaultChecked={initial.takeaway} /> À emporter
        </label>
        <label className="adm-switch">
          <input type="checkbox" name="delivery" defaultChecked={initial.delivery} /> Livraison
        </label>
      </div>

      <div>
        <h2 style={{ marginTop: 8 }}>Commande via des plateformes</h2>
        <p className="adm-card-sub">Liens vers Uber Eats, Deliveroo… Ils apparaissent sur la page « Commander ».</p>
      </div>
      {links.map((l) => (
        <div className="adm-row" key={l.id}>
          <label className="adm-field">
            <span>Nom</span>
            <input name="linkLabel" defaultValue={l.label} maxLength={40} placeholder="ex. Uber Eats" />
          </label>
          <label className="adm-field" style={{ flex: '3 1 260px' }}>
            <span>Lien</span>
            <input name="linkUrl" type="url" defaultValue={l.url} maxLength={500} placeholder="https://" />
          </label>
          <button
            type="button"
            className="adm-btn adm-btn--danger"
            onClick={() => setLinks((x) => x.filter((y) => y.id !== l.id))}
          >
            Retirer
          </button>
        </div>
      ))}
      <div>
        <button
          type="button"
          className="adm-btn adm-btn--small"
          disabled={links.length >= 6}
          onClick={() => setLinks((x) => [...x, { label: '', url: '', id: Math.max(-1, ...x.map((y) => y.id)) + 1 }])}
        >
          + Ajouter une plateforme
        </button>
      </div>

      <div>
        <h2 style={{ marginTop: 8 }}>Commande en ligne (click & collect)</h2>
        <p className="adm-card-sub">
          Les clients commandent sur le site et paient au retrait. Les commandes arrivent dans « Commandes » : gardez
          cette page ouverte pendant le service (alerte sonore à chaque nouvelle commande).
        </p>
      </div>
      <label className="adm-switch">
        <input
          type="checkbox"
          name="orderingEnabled"
          checked={ordering}
          onChange={(e) => setOrdering(e.target.checked)}
        />
        <span>
          Activer la commande en ligne
          <small>
            Seuls les produits disponibles et ayant un prix sont commandables, pendant les heures d’ouverture.
          </small>
        </span>
      </label>
      <div className="adm-row" hidden={!ordering}>
        <label className="adm-field">
          <span>Délai de préparation minimum (min)</span>
          <input name="leadMinutes" type="number" min={5} max={240} defaultValue={initial.ordering.leadMinutes} />
        </label>
        <label className="adm-field">
          <span>Intervalle des créneaux (min)</span>
          <input name="slotMinutes" type="number" min={5} max={60} defaultValue={initial.ordering.slotMinutes} />
        </label>
        <label className="adm-field" style={{ flex: '3 1 300px' }}>
          <span>Message affiché aux clients</span>
          <input name="orderingNote" maxLength={400} defaultValue={initial.ordering.note} />
        </label>
      </div>

      <div>
        <h2 style={{ marginTop: 8 }}>Réservation de table</h2>
        <p className="adm-card-sub">
          Les demandes arrivent dans « Réservations » ; vous les confirmez ou refusez, le client voit la réponse sur sa
          page de suivi.
        </p>
      </div>
      <label className="adm-switch">
        <input type="checkbox" name="reservationsEnabled" checked={resa} onChange={(e) => setResa(e.target.checked)} />
        Activer la réservation en ligne
      </label>
      <div className="adm-row" hidden={!resa}>
        <label className="adm-field">
          <span>Convives maximum</span>
          <input name="maxParty" type="number" min={1} max={60} defaultValue={initial.reservations.maxParty} />
        </label>
        <label className="adm-field">
          <span>Intervalle (min)</span>
          <input
            name="resaSlotMinutes"
            type="number"
            min={10}
            max={120}
            defaultValue={initial.reservations.slotMinutes}
          />
        </label>
        <label className="adm-field">
          <span>Délai minimum (min)</span>
          <input
            name="resaLeadMinutes"
            type="number"
            min={0}
            max={2880}
            defaultValue={initial.reservations.leadMinutes}
          />
        </label>
        <label className="adm-field">
          <span>Jours à l’avance (max)</span>
          <input name="maxDaysAhead" type="number" min={1} max={180} defaultValue={initial.reservations.maxDaysAhead} />
        </label>
        <label className="adm-field" style={{ flex: '3 1 300px' }}>
          <span>Message affiché aux clients</span>
          <input name="reservationsNote" maxLength={400} defaultValue={initial.reservations.note} />
        </label>
      </div>

      <div className="adm-actions">
        <button type="submit" className="adm-btn adm-btn--primary" disabled={pending}>
          {pending ? 'Enregistrement…' : 'Enregistrer les services'}
        </button>
      </div>
      <Toast state={state} />
    </form>
  )
}
