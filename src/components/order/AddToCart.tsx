'use client'

import Link from 'next/link'
import { useState } from 'react'
import { cart, cartCount, useCart } from './cart'
import styles from './AddToCart.module.css'

type Props = { productId: number; prices: Array<{ label: string; price: string }> }

export function AddToCart({ productId, prices }: Props) {
  const lines = useCart()
  const [choice, setChoice] = useState(0)
  const [added, setAdded] = useState(false)
  const count = cartCount(lines)

  const add = () => {
    cart.add(productId, choice)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div className={styles.box}>
      {prices.length > 1 && (
        <div className={styles.choices} role="radiogroup" aria-label="Formule">
          {prices.map((p, i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={choice === i}
              className={styles.choice}
              onClick={() => setChoice(i)}
            >
              <span>{p.label || `Option ${i + 1}`}</span>
              <strong>{p.price}</strong>
            </button>
          ))}
        </div>
      )}
      <div className={styles.actions}>
        <button type="button" className="btn" onClick={add}>
          {added ? 'Ajouté ✓' : 'Ajouter à ma commande'}
        </button>
        {count > 0 && (
          <Link href="/commander" className="btn btn--ghost">
            Voir ma commande ({count})
          </Link>
        )}
      </div>
      <p className={styles.live} aria-live="polite">
        {added ? 'Produit ajouté à votre commande.' : ''}
      </p>
    </div>
  )
}
