import { createClient } from '@/lib/supabase/server'
import { db, users, userBooks, readingSessions, userGoals } from '@readrise/db'
import { eq, and, gte, sql, isNotNull } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { BookOpen, Clock, Zap, Target } from 'lucide-react'
import { StatCard } from '@/components/stats/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

async function getStats(userId: string) {
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

  return {
    booksThisYear: booksRow?.count ?? 0,
    totalPages: pagesRow?.total ?? 0,
    totalHours: Math.round((hoursRow?.total ?? 0) / 3600),
    avgSpeed: speedRow?.avg ?? null,
    goal: goal ?? null,
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const [dbUser] = await db.select().from(users).where(eq(users.authId, authUser.id)).limit(1)
  if (!dbUser) redirect('/login')

  const stats = await getStats(dbUser.id)
  const goalPercent = stats.goal
    ? Math.min(Math.round((stats.booksThisYear / stats.goal.target) * 100), 100)
    : null

  const name = authUser.user_metadata?.full_name ?? authUser.email?.split('@')[0] ?? 'Reader'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {name}</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s your reading year so far</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Books this year"
          value={stats.booksThisYear}
          sub={`${new Date().getFullYear()} reading challenge`}
          icon={BookOpen}
        />
        <StatCard
          title="Pages read"
          value={stats.totalPages.toLocaleString()}
          sub="all time"
          icon={BookOpen}
        />
        <StatCard
          title="Hours read"
          value={stats.totalHours}
          sub="all time"
          icon={Clock}
        />
        <StatCard
          title="Reading speed"
          value={stats.avgSpeed ? `${stats.avgSpeed} p/hr` : '—'}
          sub="average pages per hour"
          icon={Zap}
        />
      </div>

      {stats.goal ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              {new Date().getFullYear()} Reading Goal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{stats.booksThisYear} of {stats.goal.target} books</span>
              <span className="text-muted-foreground">{goalPercent}%</span>
            </div>
            <Progress value={goalPercent!} className="h-2" />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-between py-4">
            <p className="text-sm text-muted-foreground">Set a reading goal for {new Date().getFullYear()}</p>
            <Button size="sm" variant="outline" asChild>
              <Link href="/goals">Set goal</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
