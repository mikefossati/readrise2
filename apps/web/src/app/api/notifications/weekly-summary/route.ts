import { db, users, userBooks, readingSessions } from '@readrise/db'
import { and, eq, gte, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { sendWeeklySummaryEmail } from '@/lib/email'
import { calculateStreak } from '@/lib/streak'

// This endpoint is meant to be called by a cron job (Vercel Cron, etc.).
// Protect with a shared secret token to prevent public access.
export async function POST(req: Request) {
  const auth = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allUsers = await db.select().from(users)
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  let sent = 0
  let failed = 0

  for (const user of allUsers) {
    try {
      // Books currently in progress
      const inProgress = await db
        .select()
        .from(userBooks)
        .where(eq(userBooks.userId, user.id))
        .then((rows) => rows.filter((r) => r.shelf === 'reading').length)

      // Pages read this week (from closed sessions)
      const pagesResult = await db
        .select({ pagesThisWeek: sql<number>`COALESCE(SUM(pages_read), 0)` })
        .from(readingSessions)
        .innerJoin(userBooks, eq(readingSessions.userBookId, userBooks.id))
        .where(and(eq(userBooks.userId, user.id), gte(readingSessions.startedAt, weekAgo)))
      const pagesThisWeek = pagesResult[0]?.pagesThisWeek ?? 0

      // Reading streak
      const sessionDays = await db
        .select({ day: sql<string>`DATE(started_at)::text` })
        .from(readingSessions)
        .innerJoin(userBooks, eq(readingSessions.userBookId, userBooks.id))
        .where(eq(userBooks.userId, user.id))
        .groupBy(sql`DATE(started_at)`)
        .orderBy(sql`DATE(started_at) DESC`)
        .then((rows) => rows.map((r) => r.day))

      const { currentStreak } = calculateStreak(sessionDays)

      await sendWeeklySummaryEmail(user.email, user.displayName, {
        booksInProgress: inProgress,
        pagesThisWeek: Number(pagesThisWeek),
        currentStreak,
      })
      sent++
    } catch {
      failed++
    }
  }

  return NextResponse.json({ sent, failed })
}
