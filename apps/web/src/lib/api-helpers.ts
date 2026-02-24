import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { db } from '@readrise/db'
import { users } from '@readrise/db'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import * as Sentry from '@sentry/nextjs'

export async function getAuthenticatedUser() {
  let authUser = null
  let authMethod: 'bearer' | 'cookie' | null = null

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
    if (authUser) authMethod = 'bearer'
  }

  // Cookie-based session — used by the web app
  if (!authUser) {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    authUser = data.user
    if (authUser) authMethod = 'cookie'
  }

  if (!authUser) {
    logger.warn('auth', { event: 'unauthenticated', method: authHeader ? 'bearer-invalid' : 'no-credentials' })
    return { user: null, dbUser: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  let dbUser
  try {
    ;[dbUser] = await db.select().from(users).where(eq(users.authId, authUser.id)).limit(1)
  } catch (err) {
    logger.error('db', { event: 'user-lookup-failed', userId: authUser.id, error: String(err) })
    Sentry.captureException(err, { tags: { layer: 'db', query: 'user-lookup' } })
    return { user: authUser, dbUser: null, error: NextResponse.json({ error: 'Internal error' }, { status: 500 }) }
  }

  if (!dbUser) {
    logger.warn('auth', { event: 'user-not-in-db', authId: authUser.id, method: authMethod })
    return { user: authUser, dbUser: null, error: NextResponse.json({ error: 'User not found' }, { status: 404 }) }
  }

  logger.debug('auth', { event: 'authenticated', userId: dbUser.id, method: authMethod })

  return { user: authUser, dbUser, error: null }
}
