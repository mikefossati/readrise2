import { stripe } from '@/lib/stripe'
import { priceIdToTier } from '@/lib/features'
import { db, users } from '@readrise/db'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import type { SubscriptionStatus } from '@readrise/types'

// Stripe requires raw body access — disable Next.js body parsing
export const config = { api: { bodyParser: false } }

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const rawBody = await req.text()

  let event: ReturnType<typeof stripe.webhooks.constructEvent>
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        // Retrieve the subscription to get the price
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id ?? ''
        const tier = priceIdToTier(priceId)

        await db
          .update(users)
          .set({
            stripeCustomerId: customerId,
            subscriptionTier: tier,
            subscriptionStatus: 'active',
            updatedAt: new Date(),
          })
          .where(eq(users.stripeCustomerId, customerId))
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const customerId = subscription.customer as string
        const status = subscription.status as SubscriptionStatus

        await db
          .update(users)
          .set({ subscriptionStatus: status, updatedAt: new Date() })
          .where(eq(users.stripeCustomerId, customerId))
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = subscription.customer as string

        await db
          .update(users)
          .set({
            subscriptionTier: 'free',
            subscriptionStatus: 'canceled',
            updatedAt: new Date(),
          })
          .where(eq(users.stripeCustomerId, customerId))
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const customerId = invoice.customer as string

        await db
          .update(users)
          .set({ subscriptionStatus: 'past_due', updatedAt: new Date() })
          .where(eq(users.stripeCustomerId, customerId))
        break
      }
    }
  } catch (err) {
    console.error('Stripe webhook handler error', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  // Always return 200 to Stripe so it doesn't retry
  return NextResponse.json({ received: true })
}
