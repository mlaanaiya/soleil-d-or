import styles from './Logo.module.css'

/** The brand mark: a sun breaking the horizon. */
export function SunMark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <clipPath id="sdo-horizon">
          <rect x="0" y="0" width="32" height="20.5" />
        </clipPath>
      </defs>
      <circle cx="16" cy="20.5" r="9.5" fill="currentColor" clipPath="url(#sdo-horizon)" />
      <path d="M2 23.5h28" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 27h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity=".55" />
    </svg>
  )
}

export function Logo({ name = "Soleil d'Or" }: { name?: string }) {
  const [first, ...rest] = name.split(' ')
  return (
    <span className={styles.logo}>
      <SunMark className={styles.mark} />
      <span className={styles.word}>
        {first} {rest.length > 0 && <span className={styles.accent}>{rest.join(' ')}</span>}
      </span>
    </span>
  )
}
