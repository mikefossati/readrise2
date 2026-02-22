import { getAuthenticatedUser } from '@/lib/api-helpers'
import { db, users } from '@readrise/db'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function POST() {
  const { dbUser, error } = await getAuthenticatedUser()
  if (error) return error

  await db
    .update(users)
    .set({ onboardingCompletedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, dbUser!.id))

  return NextResponse.json({ success: true })
}
