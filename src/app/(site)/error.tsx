'use client'

import Link from 'next/link'
import styles from './status.module.css'

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className={styles.status}>
      <div className={styles.sun} aria-hidden="true" />
      <p className="eyebrow">Petit nuage</p>
      <h1 className={styles.title}>
        Un <span className="serif sun-text">instant…</span>
      </h1>
      <p className={styles.text}>Une erreur inattendue est survenue. Réessayez, ou revenez à l’accueil.</p>
      <div className={styles.actions}>
        <button type="button" className="btn" onClick={reset}>
          Réessayer
        </button>
        <Link href="/" className="btn btn--ghost">
          Accueil
        </Link>
      </div>
    </section>
  )
}
