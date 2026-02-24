import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { db } from '@readrise/db'
import { users } from '@readrise/db'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function getAuthenticatedUser() {
  let authUser = null

  // Bearer token — used by the iOS app (and any API client)
  const headersList = await headers()
  const authHeader = headersList.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase.auth.getUser(token)
    authUser = data.user
  }

  // Cookie-based session — used by the web app
  if (!authUser) {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    authUser = data.user
  }

  if (!authUser) return { user: null, dbUser: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const [dbUser] = await db.select().from(users).where(eq(users.authId, authUser.id)).limit(1)
  if (!dbUser) return { user: authUser, dbUser: null, error: NextResponse.json({ error: 'User not found' }, { status: 404 }) }

  return { user: authUser, dbUser, error: null }
}
