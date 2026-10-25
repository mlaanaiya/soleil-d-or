import Link from 'next/link'

/** Fallback for paths outside the public site (the site has its own styled 404). */
export default function RootNotFound() {
  return (
    <main
      style={{
        minHeight: '100svh',
        display: 'grid',
        placeContent: 'center',
        justifyItems: 'center',
        gap: 16,
        textAlign: 'center',
        padding: 24,
      }}
    >
      <h1 className="display" style={{ fontSize: 'var(--t-xl)' }}>
        Page introuvable
      </h1>
      <Link href="/" className="btn">
        Retour à l’accueil
      </Link>
    </main>
  )
}
