import { createClient } from '@/lib/supabase/server'
import { db } from '@readrise/db'
import { users } from '@readrise/db'
import { sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (authUser) {
        const displayName =
          (authUser.user_metadata?.full_name as string | undefined) ??
          authUser.email?.split('@')[0] ??
          'Reader'

        // Upsert the user row — creates on first login, updates email/name on subsequent logins
        const [dbUser] = await db
          .insert(users)
          .values({
            authId: authUser.id,
            email: authUser.email!,
            displayName,
            avatarUrl: (authUser.user_metadata?.avatar_url as string | undefined) ?? null,
          })
          .onConflictDoUpdate({
            target: users.authId,
            set: {
              email: authUser.email!,
              displayName: sql`EXCLUDED.display_name`,
              avatarUrl: sql`EXCLUDED.avatar_url`,
              updatedAt: sql`NOW()`,
            },
          })
          .returning()

        // New users (no onboarding completed) go to onboarding
        if (dbUser && !dbUser.onboardingCompletedAt) {
          // Fire welcome email asynchronously — don't block the redirect
          import('@/lib/email')
            .then(({ sendWelcomeEmail }) => sendWelcomeEmail(dbUser.email, dbUser.displayName))
            .catch(() => {
              // Non-fatal: email failure should not break sign-in
            })

          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
