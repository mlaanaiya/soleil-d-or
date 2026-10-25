'use client'

import { useState } from 'react'
import styles from './Contact.module.css'

/** OpenStreetMap is only loaded on demand: no third-party request until the visitor asks for it. */
export function MapFacade({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const [loaded, setLoaded] = useState(false)
  const d = 0.006
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d * 1.6}%2C${lat - d}%2C${lng + d * 1.6}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`

  return (
    <div className={styles.map} data-loaded={loaded}>
      {loaded ? (
        <iframe src={src} title={`Carte : ${label}`} loading="lazy" referrerPolicy="no-referrer" className={styles.mapFrame} />
      ) : (
        <button type="button" className={styles.mapFacade} onClick={() => setLoaded(true)}>
          <span className={styles.mapPin} aria-hidden="true" />
          <span className={styles.mapLabel}>Afficher la carte interactive</span>
          <span className={styles.mapNote}>Chargée depuis OpenStreetMap</span>
        </button>
      )}
      <a
        className={styles.mapCredit}
        href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        © OpenStreetMap
      </a>
    </div>
  )
}
