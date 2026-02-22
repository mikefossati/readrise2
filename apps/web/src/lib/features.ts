import type { SubscriptionTier } from '@readrise/types'

export const BOOK_LIMIT_FREE = 50

export const PRICE_IDS = {
  READER_MONTHLY: process.env.STRIPE_PRICE_READER_MONTHLY ?? '',
  READER_ANNUAL: process.env.STRIPE_PRICE_READER_ANNUAL ?? '',
  BIBLIOPHILE_MONTHLY: process.env.STRIPE_PRICE_BIBLIOPHILE_MONTHLY ?? '',
  BIBLIOPHILE_ANNUAL: process.env.STRIPE_PRICE_BIBLIOPHILE_ANNUAL ?? '',
} as const

/**
 * Returns the maximum number of books for a given tier, or null for unlimited.
 */
export function getBookLimit(tier: SubscriptionTier): number | null {
  return tier === 'free' ? BOOK_LIMIT_FREE : null
}

/**
 * Maps a Stripe price ID back to the corresponding subscription tier.
 * Returns 'free' for any unrecognised price ID.
 */
export function priceIdToTier(priceId: string): SubscriptionTier {
  if (priceId === PRICE_IDS.READER_MONTHLY || priceId === PRICE_IDS.READER_ANNUAL) {
    return 'reader'
  }
  if (priceId === PRICE_IDS.BIBLIOPHILE_MONTHLY || priceId === PRICE_IDS.BIBLIOPHILE_ANNUAL) {
    return 'bibliophile'
  }
  return 'free'
}
