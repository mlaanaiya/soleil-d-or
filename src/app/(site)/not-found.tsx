import Link from 'next/link'
import styles from './status.module.css'

export default function NotFound() {
  return (
    <section className={styles.status}>
      <div className={styles.sun} aria-hidden="true" />
      <p className="eyebrow">Erreur 404</p>
      <h1 className={styles.title}>
        Éclipse <span className="serif sun-text">totale</span>
      </h1>
      <p className={styles.text}>Cette page n’existe pas ou plus. Le soleil brille ailleurs :</p>
      <div className={styles.actions}>
        <Link href="/carte" className="btn">
          Voir la carte
          <span className="btn-dot" aria-hidden="true" />
        </Link>
        <Link href="/" className="btn btn--ghost">
          Accueil
        </Link>
      </div>
    </section>
  )
}
