import Link from 'next/link'
import styles from './FinalCta.module.css'

export function FinalCta({
  title,
  primary,
  secondary,
}: {
  title: string
  primary: { href: string; label: string }
  secondary: { href: string; label: string }
}) {
  return (
    <section className={`section ${styles.cta}`} aria-labelledby="cta-title">
      <div className={`container ${styles.inner}`}>
        <div className={styles.sun} aria-hidden="true" />
        <h2 id="cta-title" className={styles.title} data-reveal="up">
          {title}
        </h2>
        <div className={styles.actions} data-reveal="up" style={{ '--d': '0.15s' } as React.CSSProperties}>
          <Link href={primary.href} className="btn btn--dark">
            {primary.label}
            <span className="btn-dot" aria-hidden="true" />
          </Link>
          <Link href={secondary.href} className={`btn ${styles.secondary}`}>
            {secondary.label}
          </Link>
        </div>
      </div>
    </section>
  )
}
