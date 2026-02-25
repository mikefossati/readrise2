import { cache } from 'react'
import { db, readingSessions, userBooks } from '@readrise/db'
import { eq, and, isNotNull, sql } from 'drizzle-orm'
import { calculateStreak } from '@/lib/streak'

/**
 * Returns the current reading streak for a user.
 * Wrapped with React.cache() so that multiple callers within the same
 * server render (e.g. layout.tsx + dashboard/page.tsx) share one DB query.
 */
export const getStreak = cache(async (userId: string): Promise<number> => {
  const sessionDays = await db
    .selectDistinct({ day: sql<string>`date_trunc('day', reading_sessions.started_at)::date::text` })
    .from(readingSessions)
    .innerJoin(userBooks, eq(readingSessions.userBookId, userBooks.id))
    .where(and(eq(userBooks.userId, userId), isNotNull(readingSessions.endedAt)))
    .orderBy(sql`1 desc`)
    .limit(365)
  const days = sessionDays.map((r) => r.day).filter(Boolean) as string[]
  return calculateStreak(days).currentStreak
})
