import { getAuthenticatedUser } from '@/lib/api-helpers'
import { NextResponse } from 'next/server'

export async function GET() {
  const { dbUser, error } = await getAuthenticatedUser()
  if (error) return error

  return NextResponse.json({
    data: {
      subscriptionTier: dbUser!.subscriptionTier,
      subscriptionStatus: dbUser!.subscriptionStatus,
      stripeCustomerId: dbUser!.stripeCustomerId,
    },
  })
}
