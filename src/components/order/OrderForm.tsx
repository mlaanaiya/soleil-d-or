'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { placeOrder } from '@/app/(site)/commander/actions'
import { Picture } from '@/components/ui/Picture'
import { formatPrice } from '@/lib/format'
import type { TimeOption } from '@/lib/hours'
import type { Media } from '@/lib/types'
import { cart, cartCount, useCart } from './cart'
import styles from './Booking.module.css'

export type OrderableProduct = {
  id: number
  name: string
  photo: Media | null
  prices: Array<{ label: string; cents: number }>
}
export type OrderableCategory = { slug: string; name: string; products: OrderableProduct[] }

type Props = { categories: OrderableCategory[]; slots: TimeOption[]; note: string; closedMessage: string | null }

export function OrderForm({ categories, slots, note, closedMessage }: Props) {
  const router = useRouter()
  const lines = useCart()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [sheetOpen, setSheetOpen] = useState(false)

  const byId = useMemo(() => new Map(categories.flatMap((c) => c.products).map((p) => [p.id, p])), [categories])
  // Lines whose product or price option no longer exists are ignored (and dropped at checkout).
  const resolved = lines
    .map((l) => {
      const product = byId.get(l.productId)
      const price = product?.prices[l.priceIndex]
      return product && price ? { ...l, product, price } : null
    })
    .filter((l): l is NonNullable<typeof l> => l !== null)
  const total = resolved.reduce((sum, l) => sum + l.price.cents * l.quantity, 0)
  const count = cartCount(resolved)

  const submit = (form: FormData) => {
    setError(null)
    setFields({})
    const payload = {
      name: String(form.get('name') ?? ''),
      phone: String(form.get('phone') ?? ''),
      pickupAt: String(form.get('pickupAt') ?? ''),
      note: String(form.get('note') ?? ''),
      items: resolved.map((l) => ({ productId: l.productId, priceIndex: l.priceIndex, quantity: l.quantity })),
    }
    startTransition(async () => {
      const result = await placeOrder(payload, String(form.get('website') ?? ''))
      if (result.ok) {
        cart.clear()
        router.push(result.url)
      } else {
        setError(result.error)
        setFields(result.fields ?? {})
      }
    })
  }

  return (
    <div className={styles.orderLayout}>
      <div className={styles.picker}>
        {categories.map((c) => (
          <section key={c.slug} className={styles.pickCat} aria-labelledby={`pick-${c.slug}`}>
            <h2 id={`pick-${c.slug}`} className={styles.pickTitle}>
              {c.name}
            </h2>
            <ul className={styles.pickList}>
              {c.products.map((p) => (
                <li key={p.id} className={styles.pickItem}>
                  <div className={styles.pickThumb}>{p.photo && <Picture media={p.photo} sizes="72px" alt="" />}</div>
                  <div className={styles.pickBody}>
                    <h3 className={styles.pickName}>{p.name}</h3>
                    <div className={styles.pickPrices}>
                      {p.prices.map((price, i) => (
                        <button
                          key={i}
                          type="button"
                          className={styles.addBtn}
                          onClick={() => cart.add(p.id, i)}
                          aria-label={`Ajouter ${p.name}${price.label ? ` (${price.label})` : ''}`}
                        >
                          {price.label && <span>{price.label}</span>}
                          <strong>{formatPrice(price.cents)}</strong>
                          <span className={styles.plus} aria-hidden="true">
                            +
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <aside className={styles.summary} data-open={sheetOpen} aria-label="Ma commande">
        <button
          type="button"
          className={styles.sheetToggle}
          onClick={() => setSheetOpen((v) => !v)}
          aria-expanded={sheetOpen}
        >
          <span>Ma commande ({count})</span>
          <strong>{formatPrice(total)}</strong>
        </button>

        <div className={styles.summaryInner}>
          <h2 className={styles.summaryTitle}>Ma commande</h2>
          {resolved.length === 0 ? (
            <p className={styles.emptyCart}>Ajoutez des produits depuis la carte ci-contre.</p>
          ) : (
            <ul className={styles.lines}>
              {resolved.map((l) => (
                <li key={`${l.productId}:${l.priceIndex}`} className={styles.line}>
                  <div>
                    <p className={styles.lineName}>{l.product.name}</p>
                    {l.price.label && <p className={styles.lineLabel}>{l.price.label}</p>}
                  </div>
                  <div className={styles.stepper}>
                    <button
                      type="button"
                      onClick={() => cart.set(l.productId, l.priceIndex, l.quantity - 1)}
                      aria-label={`Retirer un ${l.product.name}`}
                    >
                      −
                    </button>
                    <span aria-live="polite">{l.quantity}</span>
                    <button
                      type="button"
                      onClick={() => cart.set(l.productId, l.priceIndex, l.quantity + 1)}
                      aria-label={`Ajouter un ${l.product.name}`}
                    >
                      +
                    </button>
                  </div>
                  <strong className={styles.lineTotal}>{formatPrice(l.price.cents * l.quantity)}</strong>
                </li>
              ))}
            </ul>
          )}
          <p className={styles.total}>
            <span>Total</span>
            <strong>{formatPrice(total)}</strong>
          </p>

          {closedMessage ? (
            <p className={styles.closed}>{closedMessage}</p>
          ) : (
            <form action={submit} className={styles.form} noValidate>
              <label className={styles.field}>
                <span>Heure de retrait</span>
                <select name="pickupAt" required defaultValue={slots[0]?.value} aria-invalid={Boolean(fields.pickupAt)}>
                  {slots.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {fields.pickupAt && <em>{fields.pickupAt}</em>}
              </label>
              <label className={styles.field}>
                <span>Nom</span>
                <input name="name" autoComplete="name" required maxLength={60} aria-invalid={Boolean(fields.name)} />
                {fields.name && <em>{fields.name}</em>}
              </label>
              <label className={styles.field}>
                <span>Téléphone</span>
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  required
                  maxLength={24}
                  aria-invalid={Boolean(fields.phone)}
                />
                {fields.phone && <em>{fields.phone}</em>}
              </label>
              <label className={styles.field}>
                <span>Précisions (facultatif)</span>
                <textarea name="note" rows={2} maxLength={300} />
              </label>
              <label className={styles.honeypot} aria-hidden="true">
                Site web
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
              {note && <p className={styles.formNote}>{note}</p>}
              <p className={styles.formNote}>Paiement au retrait de la commande, au restaurant.</p>
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
              <button type="submit" className="btn" disabled={pending || resolved.length === 0}>
                {pending ? 'Envoi…' : 'Envoyer la commande'}
              </button>
            </form>
          )}
        </div>
      </aside>
    </div>
  )
}
