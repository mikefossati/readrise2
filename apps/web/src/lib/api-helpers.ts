import { createClient } from '@/lib/supabase/server'
import { db } from '@readrise/db'
import { users } from '@readrise/db'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return { user: null, dbUser: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const [dbUser] = await db.select().from(users).where(eq(users.authId, authUser.id)).limit(1)
  if (!dbUser) return { user: authUser, dbUser: null, error: NextResponse.json({ error: 'User not found' }, { status: 404 }) }

  return { user: authUser, dbUser, error: null }
}
