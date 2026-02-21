import { NextResponse } from 'next/server'
import { db, userBooks, books, readingSessions, progressEntries } from '@readrise/db'
import { eq, and, gte, sql, isNotNull } from 'drizzle-orm'
import { getAuthenticatedUser } from '@/lib/api-helpers'

export async function GET() {
  const { dbUser, error } = await getAuthenticatedUser()
  if (error) return error

  const userId = dbUser!.id
  const thisYear = new Date().getFullYear()
  const yearStart = `${thisYear}-01-01`

  // Books finished this year
  const [{ count: booksThisYear }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userBooks)
    .where(and(eq(userBooks.userId, userId), eq(userBooks.shelf, 'finished'), gte(userBooks.finishedAt, yearStart)))

  // Total pages read (all time) — from progress entries
  const [{ total: totalPagesAllTime }] = await db
    .select({ total: sql<number>`coalesce(sum(pages_read), 0)::int` })
    .from(readingSessions)
    .innerJoin(userBooks, eq(readingSessions.userBookId, userBooks.id))
    .where(and(eq(userBooks.userId, userId), isNotNull(readingSessions.pagesRead)))

  // Total pages this year
  const [{ total: totalPagesThisYear }] = await db
    .select({ total: sql<number>`coalesce(sum(pages_read), 0)::int` })
    .from(readingSessions)
    .innerJoin(userBooks, eq(readingSessions.userBookId, userBooks.id))
    .where(and(eq(userBooks.userId, userId), isNotNull(readingSessions.pagesRead), gte(readingSessions.startedAt, new Date(yearStart))))

  // Total hours read (all time)
  const [{ total: totalSecondsAllTime }] = await db
    .select({ total: sql<number>`coalesce(sum(duration_seconds), 0)::int` })
    .from(readingSessions)
    .innerJoin(userBooks, eq(readingSessions.userBookId, userBooks.id))
    .where(and(eq(userBooks.userId, userId), isNotNull(readingSessions.durationSeconds)))

  // Average pages per hour
  const [{ avg: avgPagesPerHour }] = await db
    .select({ avg: sql<number>`avg(pages_per_hour)` })
    .from(readingSessions)
    .innerJoin(userBooks, eq(readingSessions.userBookId, userBooks.id))
    .where(and(eq(userBooks.userId, userId), isNotNull(readingSessions.pagesPerHour)))

  // Genre breakdown (from finished books)
  const genreRows = await db
    .select({ genres: books.genres })
    .from(userBooks)
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .where(and(eq(userBooks.userId, userId), eq(userBooks.shelf, 'finished')))

  const genreMap = new Map<string, number>()
  for (const row of genreRows) {
    for (const genre of row.genres ?? []) {
      const normalized = genre.split(' / ')[0]!.trim()
      genreMap.set(normalized, (genreMap.get(normalized) ?? 0) + 1)
    }
  }
  const genreBreakdown = [...genreMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([genre, count]) => ({ genre, count }))

  // Streak — count consecutive days with at least one session
  const sessionDays = await db
    .selectDistinct({ day: sql<string>`date_trunc('day', started_at)::date::text` })
    .from(readingSessions)
    .innerJoin(userBooks, eq(readingSessions.userBookId, userBooks.id))
    .where(and(eq(userBooks.userId, userId), isNotNull(readingSessions.endedAt)))
    .orderBy(sql`1 desc`)
    .limit(365)

  const days = sessionDays.map((r) => r.day).filter(Boolean) as string[]
  let currentStreak = 0
  let longestStreak = 0
  let streak = 0
  const today = new Date().toISOString().split('T')[0]!

  for (let i = 0; i < days.length; i++) {
    const expected = new Date(today)
    expected.setDate(expected.getDate() - i)
    const expectedStr = expected.toISOString().split('T')[0]!
    if (days[i] === expectedStr) {
      streak++
      if (i === 0 || i === 1) currentStreak = streak
    } else {
      if (streak > longestStreak) longestStreak = streak
      streak = 1
      if (i > 1 && currentStreak === 0) break
    }
  }
  if (streak > longestStreak) longestStreak = streak

  return NextResponse.json({
    data: {
      booksReadThisYear: booksThisYear ?? 0,
      totalPagesAllTime: totalPagesAllTime ?? 0,
      totalPagesThisYear: totalPagesThisYear ?? 0,
      totalHoursAllTime: Math.round((totalSecondsAllTime ?? 0) / 3600),
      averagePagesPerHour: avgPagesPerHour ? Math.round(avgPagesPerHour) : null,
      genreBreakdown,
      streak: {
        currentStreak,
        longestStreak,
        lastActiveDate: days[0] ?? null,
      },
    },
  })
}
