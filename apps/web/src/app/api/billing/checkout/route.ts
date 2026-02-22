import { getAuthenticatedUser } from '@/lib/api-helpers'
import { stripe } from '@/lib/stripe'
import { db, users } from '@readrise/db'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({ priceId: z.string().min(1) })

export async function POST(req: Request) {
  const { dbUser, error } = await getAuthenticatedUser()
  if (error) return error

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { priceId } = parsed.data

  // Retrieve or create the Stripe customer for this user
  let customerId = dbUser!.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: dbUser!.email,
      name: dbUser!.displayName,
      metadata: { readriseUserId: dbUser!.id },
    })
    customerId = customer.id

    await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, dbUser!.id))
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/billing?success=1`,
    cancel_url: `${appUrl}/billing`,
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
