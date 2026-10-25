import { describe, expect, it } from 'vitest'
import { formatPrice, fromPrice, fullAddress, parsePriceInput, slugify, telHref } from '@/lib/format'
import { priceLabel } from '@/lib/summary'
import { restaurantSchema, servicesSchema, contentSchema } from '@/lib/schemas'

describe('prices', () => {
  it('parses French and English inputs into cents', () => {
    expect(parsePriceInput('8,50')).toBe(850)
    expect(parsePriceInput('8.5')).toBe(850)
    expect(parsePriceInput(' 12 € ')).toBe(1200)
    expect(parsePriceInput('0,99')).toBe(99)
  })
  it('rejects anything that is not an amount', () => {
    for (const bad of ['', 'abc', '8,505', '-3', '1e3', '8,,5']) expect(parsePriceInput(bad)).toBeNull()
  })
  it('formats euros the French way', () => {
    expect(formatPrice(850).replace(/\s/g, ' ')).toBe('8,50 €')
  })
  it('labels a starting price when several formulas exist', () => {
    expect(fromPrice([])).toBeNull()
    expect(priceLabel({ prices: [] })).toBeNull()
    expect(
      priceLabel({
        prices: [
          { label: 'Menu', cents: 1100 },
          { label: 'Seul', cents: 850 },
        ],
      })?.replace(/\s/g, ' '),
    ).toBe('dès 8,50 €')
  })
})

describe('text helpers', () => {
  it('slugifies accents and apostrophes', () => {
    expect(slugify('Crousty riz « poulet » épicé')).toBe('crousty-riz-poulet-epice')
    expect(slugify("Soleil d'Or")).toBe('soleil-d-or')
  })
  it('builds phone links and addresses', () => {
    expect(telHref('01 23 45 67 89')).toBe('tel:0123456789')
    expect(fullAddress({ street: '1 rue du Soleil', postalCode: '75000', city: 'Paris' })).toBe(
      '1 rue du Soleil, 75000 Paris',
    )
    expect(fullAddress({ street: '', postalCode: '', city: '' })).toBe('')
  })
})

describe('settings schemas', () => {
  it('never invents restaurant data: defaults are empty', () => {
    const r = restaurantSchema.parse({})
    expect(r).toMatchObject({ name: "Soleil d'Or", street: '', phone: '', lat: null, lng: null })
  })
  it('only accepts https social links', () => {
    expect(restaurantSchema.safeParse({ socials: { instagram: 'http://insecure.example' } }).success).toBe(false)
    expect(restaurantSchema.safeParse({ socials: { instagram: 'javascript:alert(1)' } }).success).toBe(false)
    expect(restaurantSchema.safeParse({ socials: { instagram: 'https://instagram.com/x' } }).success).toBe(true)
  })
  it('keeps online services disabled by default', () => {
    const s = servicesSchema.parse({})
    expect(s.ordering.enabled).toBe(false)
    expect(s.reservations.enabled).toBe(false)
    expect(s.externalLinks).toEqual([])
  })
  it('provides editorial defaults', () => {
    expect(contentSchema.parse({}).chapters.length).toBeGreaterThan(0)
  })
})
