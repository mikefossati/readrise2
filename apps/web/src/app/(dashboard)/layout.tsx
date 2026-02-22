import { Sidebar } from '@/components/layout/sidebar'
import { UserMenu } from '@/components/layout/user-menu'
import { Toaster } from '@/components/ui/sonner'
import { getAuthenticatedUser } from '@/lib/api-helpers'
import { redirect } from 'next/navigation'
import { db, readingSessions, userBooks } from '@readrise/db'
import { eq, isNotNull, and, sql } from 'drizzle-orm'
import { calculateStreak } from '@/lib/streak'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { dbUser, error } = await getAuthenticatedUser()

  if (error) redirect('/login')

  if (dbUser && !dbUser.onboardingCompletedAt) {
    redirect('/onboarding')
  }

  let currentStreak = 0
  if (dbUser) {
    const sessionDays = await db
      .selectDistinct({ day: sql<string>`date_trunc('day', reading_sessions.started_at)::date::text` })
      .from(readingSessions)
      .innerJoin(userBooks, eq(readingSessions.userBookId, userBooks.id))
      .where(and(eq(userBooks.userId, dbUser.id), isNotNull(readingSessions.endedAt)))
      .orderBy(sql`1 desc`)
      .limit(365)
    const days = sessionDays.map((r) => r.day).filter(Boolean) as string[]
    currentStreak = calculateStreak(days).currentStreak
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar subscriptionTier={dbUser?.subscriptionTier ?? 'free'} currentStreak={currentStreak} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-12 items-center justify-end border-b bg-card px-4">
          <UserMenu />
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <Toaster richColors />
    </div>
  )
}
