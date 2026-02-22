import Stripe from 'stripe'

// Singleton pattern — safe to import at module level (lazy init handled by Stripe SDK)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
  apiVersion: '2026-01-28.clover',
})
