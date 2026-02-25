import { createClient } from '@/lib/supabase/server'
import { db, users, userBooks, books, readingSessions, userGoals, progressEntries } from '@readrise/db'
import { eq, and, gte, sql, isNotNull, desc } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { Flame, Target } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { formatDuration } from '@/lib/format'
import { getStreak } from '@/lib/queries/streak'

async function getDashboardData(userId: string) {
  const thisYear = new Date().getFullYear()
  const yearStart = `${thisYear}-01-01`

  const [booksRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userBooks)
    .where(and(eq(userBooks.userId, userId), eq(userBooks.shelf, 'finished'), gte(userBooks.finishedAt, yearStart)))

  const [pagesRow] = await db
    .select({ total: sql<number>`coalesce(sum(pages_read), 0)::int` })
    .from(readingSessions)
    .innerJoin(userBooks, eq(readingSessions.userBookId, userBooks.id))
    .where(and(eq(userBooks.userId, userId), isNotNull(readingSessions.pagesRead)))

  const [hoursRow] = await db
    .select({ total: sql<number>`coalesce(sum(duration_seconds), 0)::int` })
    .from(readingSessions)
    .innerJoin(userBooks, eq(readingSessions.userBookId, userBooks.id))
    .where(and(eq(userBooks.userId, userId), isNotNull(readingSessions.durationSeconds)))

  const [speedRow] = await db
    .select({ avg: sql<number>`round(avg(pages_per_hour))::int` })
    .from(readingSessions)
    .innerJoin(userBooks, eq(readingSessions.userBookId, userBooks.id))
    .where(and(eq(userBooks.userId, userId), isNotNull(readingSessions.pagesPerHour)))

  const [goal] = await db
    .select()
    .from(userGoals)
    .where(and(eq(userGoals.userId, userId), eq(userGoals.year, thisYear), eq(userGoals.goalType, 'book_count')))
    .limit(1)

  // Currently reading — most recently updated
  const [readingRow] = await db
    .select()
    .from(userBooks)
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .where(and(eq(userBooks.userId, userId), eq(userBooks.shelf, 'reading')))
    .orderBy(desc(userBooks.updatedAt))
    .limit(1)

  let currentPage: number | null = null
  if (readingRow) {
    const [entry] = await db
      .select()
      .from(progressEntries)
      .where(eq(progressEntries.userBookId, readingRow.user_books.id))
      .orderBy(desc(progressEntries.loggedAt))
      .limit(1)
    currentPage = entry?.page ?? null
  }

  // Recent sessions (last 3 completed)
  const recentSessions = await db
    .select({
      id: readingSessions.id,
      startedAt: readingSessions.startedAt,
      durationSeconds: readingSessions.durationSeconds,
      pagesRead: readingSessions.pagesRead,
      pagesPerHour: readingSessions.pagesPerHour,
      bookTitle: books.title,
      bookCoverUrl: books.coverUrl,
      userBookId: userBooks.id,
    })
    .from(readingSessions)
    .innerJoin(userBooks, eq(readingSessions.userBookId, userBooks.id))
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .where(and(eq(userBooks.userId, userId), isNotNull(readingSessions.endedAt)))
    .orderBy(desc(readingSessions.startedAt))
    .limit(3)

  return {
    booksThisYear: booksRow?.count ?? 0,
    totalPages: pagesRow?.total ?? 0,
    totalHours: Math.round((hoursRow?.total ?? 0) / 3600),
    avgSpeed: speedRow?.avg ?? null,
    goal: goal ?? null,
    currentlyReading: readingRow
      ? { ub: readingRow.user_books, book: readingRow.books, currentPage }
      : null,
    recentSessions,
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const [dbUser] = await db.select().from(users).where(eq(users.authId, authUser.id)).limit(1)
  if (!dbUser) redirect('/login')

  const [data, currentStreak] = await Promise.all([
    getDashboardData(dbUser.id),
    getStreak(dbUser.id),
  ])
  const goalPercent = data.goal
    ? Math.min(Math.round((data.booksThisYear / data.goal.target) * 100), 100)
    : null

  const firstName = (authUser.user_metadata?.full_name as string | undefined)?.split(' ')[0]
    ?? authUser.email?.split('@')[0]
    ?? 'Reader'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {greeting}, {firstName}.
          </h1>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>
      </div>

      {/* Streak hero */}
      <div className="rounded-xl bg-[#fef3e2] px-5 py-4 dark:bg-[#3d3928]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Flame className={`h-7 w-7 shrink-0 ${currentStreak > 0 ? 'text-[#e8923a]' : 'text-muted-foreground'}`} />
            <div>
              <p className="font-display text-xl font-bold">
                {currentStreak > 0
                  ? `${currentStreak}-day streak`
                  : 'Start your streak'}
              </p>
              <p className="text-sm text-muted-foreground">
                {currentStreak > 0
                  ? 'Keep it going — log a session today.'
                  : 'Read today to start a streak.'}
              </p>
            </div>
          </div>
          {data.currentlyReading && (
            <Button size="sm" className="shrink-0" asChild>
              <Link href={`/books/${data.currentlyReading.ub.id}`}>
                Continue →
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Compact stat row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'books this year', value: data.booksThisYear },
          { label: 'pages read', value: data.totalPages.toLocaleString() },
          { label: 'hours read', value: data.totalHours },
          { label: 'pages / hr', value: data.avgSpeed ?? '—' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border bg-card px-4 py-3">
            <p className="text-xl font-bold tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Goal + Currently Reading */}
      <div className="grid gap-4 sm:grid-cols-2">
        {data.goal ? (
          <Card>
            <CardContent className="space-y-3 pt-5">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">{new Date().getFullYear()} Reading Goal</p>
              </div>
              <div className="flex items-end justify-between">
                <span className="font-display text-3xl font-bold">{data.booksThisYear}</span>
                <span className="text-sm text-muted-foreground">of {data.goal.target} books</span>
              </div>
              <Progress value={goalPercent!} className="h-1.5" />
              <p className="text-xs text-muted-foreground">{goalPercent}% complete</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-between py-5">
              <p className="text-sm text-muted-foreground">Set a {new Date().getFullYear()} reading goal</p>
              <Button size="sm" variant="outline" asChild>
                <Link href="/goals">Set goal</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {data.currentlyReading ? (
          <Card className="overflow-hidden">
            <CardContent className="pt-5">
              <p className="mb-3 text-sm font-medium">Currently reading</p>
              <Link href={`/books/${data.currentlyReading.ub.id}`} className="group flex gap-3">
                <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded bg-muted shadow-sm">
                  {data.currentlyReading.book.coverUrl ? (
                    <Image
                      src={data.currentlyReading.book.coverUrl}
                      alt={data.currentlyReading.book.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="44px"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium leading-tight transition-colors group-hover:text-primary">
                    {data.currentlyReading.book.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {data.currentlyReading.book.authors[0]}
                  </p>
                  {data.currentlyReading.currentPage && data.currentlyReading.book.pageCount && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      p. {data.currentlyReading.currentPage} / {data.currentlyReading.book.pageCount}
                    </p>
                  )}
                </div>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-between py-5">
              <p className="text-sm text-muted-foreground">No book in progress</p>
              <Button size="sm" variant="outline" asChild>
                <Link href="/library">Browse library</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent sessions */}
      {data.recentSessions.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">Recent sessions</p>
            <Link href="/library" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              All books →
            </Link>
          </div>
          <div className="space-y-2">
            {data.recentSessions.map((s) => (
              <Link
                key={s.id}
                href={`/books/${s.userBookId}`}
                className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-accent"
              >
                <div className="relative h-10 w-7 shrink-0 overflow-hidden rounded bg-muted">
                  {s.bookCoverUrl ? (
                    <Image src={s.bookCoverUrl} alt={s.bookTitle} fill className="object-cover" sizes="28px" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.bookTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.startedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {s.durationSeconds ? ` · ${formatDuration(s.durationSeconds)}` : ''}
                  </p>
                </div>
                {s.pagesPerHour != null && (
                  <p className="shrink-0 text-xs text-muted-foreground">{Math.round(s.pagesPerHour)} p/hr</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
