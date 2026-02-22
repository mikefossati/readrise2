import { describe, test, expect, vi, beforeAll } from 'vitest'
import { getBookLimit } from './features'

describe('getBookLimit', () => {
  test('free tier → 50', () => {
    expect(getBookLimit('free')).toBe(50)
  })

  test('reader tier → null (unlimited)', () => {
    expect(getBookLimit('reader')).toBeNull()
  })

  test('bibliophile tier → null (unlimited)', () => {
    expect(getBookLimit('bibliophile')).toBeNull()
  })
})

describe('priceIdToTier', () => {
  // PRICE_IDS is computed at import time from env vars, so we must reload the
  // module after setting unique env values to avoid collisions between tiers.
  let priceIdToTier: (id: string) => string

  beforeAll(async () => {
    process.env.STRIPE_PRICE_READER_MONTHLY = 'price_test_reader_mo'
    process.env.STRIPE_PRICE_READER_ANNUAL = 'price_test_reader_yr'
    process.env.STRIPE_PRICE_BIBLIOPHILE_MONTHLY = 'price_test_biblio_mo'
    process.env.STRIPE_PRICE_BIBLIOPHILE_ANNUAL = 'price_test_biblio_yr'
    vi.resetModules()
    priceIdToTier = (await import('./features')).priceIdToTier
  })

  test('reader monthly price ID → reader', () => {
    expect(priceIdToTier('price_test_reader_mo')).toBe('reader')
  })

  test('reader annual price ID → reader', () => {
    expect(priceIdToTier('price_test_reader_yr')).toBe('reader')
  })

  test('bibliophile monthly price ID → bibliophile', () => {
    expect(priceIdToTier('price_test_biblio_mo')).toBe('bibliophile')
  })

  test('unknown price ID → free', () => {
    expect(priceIdToTier('completely_unknown_price_id_xyz')).toBe('free')
  })
})
