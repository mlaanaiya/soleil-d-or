import styles from './PageHero.module.css'

type Props = {
  eyebrow: string
  title: string
  accent?: string
  intro?: string
  children?: React.ReactNode
}

/** Shared opening for inner pages: the title rises from the horizon like the home hero. */
export function PageHero({ eyebrow, title, accent, intro, children }: Props) {
  return (
    <section className={styles.hero}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={`container ${styles.inner}`}>
        <p className={`eyebrow ${styles.eyebrow}`}>
          <span className={styles.dot} aria-hidden="true" />
          {eyebrow}
        </p>
        <h1 className={styles.title}>
          <span className={styles.mask}>
            <span className={styles.word}>{title}</span>
          </span>
          {accent && <span className={`serif ${styles.accent}`}>{accent}</span>}
        </h1>
        <div className={styles.horizon} aria-hidden="true" />
        {(intro || children) && (
          <div className={styles.foot}>
            {intro && <p className={styles.intro}>{intro}</p>}
            {children}
          </div>
        )}
      </div>
    </section>
  )
}
