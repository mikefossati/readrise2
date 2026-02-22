import { getAuthenticatedUser } from '@/lib/api-helpers'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST() {
  const { dbUser, error } = await getAuthenticatedUser()
  if (error) return error

  if (!dbUser!.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 404 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.billingPortal.sessions.create({
    customer: dbUser!.stripeCustomerId,
    return_url: `${appUrl}/billing`,
  })

  return NextResponse.json({ url: session.url })
}
