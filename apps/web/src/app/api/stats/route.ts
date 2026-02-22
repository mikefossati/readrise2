import { NextResponse } from 'next/server'
import { db, userBooks, books, readingSessions } from '@readrise/db'
import { eq, and, gte, sql, isNotNull } from 'drizzle-orm'
import { getAuthenticatedUser } from '@/lib/api-helpers'
import { calculateStreak } from '@/lib/streak'

export async function GET() {
  const { dbUser, error } = await getAuthenticatedUser()
  if (error) return error

  const userId = dbUser!.id
  const thisYear = new Date().getFullYear()
  const yearStart = `${thisYear}-01-01`

  // Books finished this year
  const booksThisYear = (await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userBooks)
    .where(and(eq(userBooks.userId, userId), eq(userBooks.shelf, 'finished'), gte(userBooks.finishedAt, yearStart)))
  )[0]?.count ?? 0

  // Total pages read (all time)
  const totalPagesAllTime = (await db
    .select({ total: sql<number>`coalesce(sum(pages_read), 0)::int` })
    .from(readingSessions)
    .innerJoin(userBooks, eq(readingSessions.userBookId, userBooks.id))
    .where(and(eq(userBooks.userId, userId), isNotNull(readingSessions.pagesRead)))
  )[0]?.total ?? 0

  // Total pages this year
  const totalPagesThisYear = (await db
    .select({ total: sql<number>`coalesce(sum(pages_read), 0)::int` })
    .from(readingSessions)
    .innerJoin(userBooks, eq(readingSessions.userBookId, userBooks.id))
    .where(and(eq(userBooks.userId, userId), isNotNull(readingSessions.pagesRead), gte(readingSessions.startedAt, new Date(yearStart))))
  )[0]?.total ?? 0

  // Total hours read (all time)
  const totalSecondsAllTime = (await db
    .select({ total: sql<number>`coalesce(sum(duration_seconds), 0)::int` })
    .from(readingSessions)
    .innerJoin(userBooks, eq(readingSessions.userBookId, userBooks.id))
    .where(and(eq(userBooks.userId, userId), isNotNull(readingSessions.durationSeconds)))
  )[0]?.total ?? 0

  // Average pages per hour
  const avgPagesPerHour = (await db
    .select({ avg: sql<number>`avg(pages_per_hour)` })
    .from(readingSessions)
    .innerJoin(userBooks, eq(readingSessions.userBookId, userBooks.id))
    .where(and(eq(userBooks.userId, userId), isNotNull(readingSessions.pagesPerHour)))
  )[0]?.avg ?? null

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

  // Books finished per month this year (for bar chart)
  const monthlyRows = await db
    .select({
      month: sql<number>`extract(month from finished_at)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(userBooks)
    .where(and(eq(userBooks.userId, userId), eq(userBooks.shelf, 'finished'), gte(userBooks.finishedAt, yearStart)))
    .groupBy(sql`extract(month from finished_at)`)
  const booksPerMonth: number[] = Array(12).fill(0)
  for (const { month, count } of monthlyRows) {
    if (month >= 1 && month <= 12) booksPerMonth[month - 1] = count
  }

  // Streak — count consecutive days with at least one session
  const sessionDays = await db
    .selectDistinct({ day: sql<string>`date_trunc('day', reading_sessions.started_at)::date::text` })
    .from(readingSessions)
    .innerJoin(userBooks, eq(readingSessions.userBookId, userBooks.id))
    .where(and(eq(userBooks.userId, userId), isNotNull(readingSessions.endedAt)))
    .orderBy(sql`1 desc`)
    .limit(365)

  const days = sessionDays.map((r) => r.day).filter(Boolean) as string[]
  const { currentStreak, longestStreak } = calculateStreak(days)

  return NextResponse.json({
    data: {
      booksReadThisYear: booksThisYear ?? 0,
      totalPagesAllTime: totalPagesAllTime ?? 0,
      totalPagesThisYear: totalPagesThisYear ?? 0,
      totalHoursAllTime: Math.round((totalSecondsAllTime ?? 0) / 3600),
      averagePagesPerHour: avgPagesPerHour ? Math.round(avgPagesPerHour) : null,
      booksPerMonth,
      genreBreakdown,
      streak: {
        currentStreak,
        longestStreak,
        lastActiveDate: days[0] ?? null,
      },
    },
  })
}
