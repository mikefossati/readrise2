import { createClient } from '@/lib/supabase/server'
import { db, userBooks, books, progressEntries, readingSessions, reviews, users } from '@readrise/db'
import { eq, and, desc, isNull } from 'drizzle-orm'
import { redirect, notFound } from 'next/navigation'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ProgressForm } from '@/components/reading/progress-form'
import { SessionTimer } from '@/components/reading/session-timer'
import { ReviewForm } from '@/components/reading/review-form'
import { formatDate, formatDuration } from '@/lib/format'
import { ShelfActions } from '@/components/books/shelf-actions'

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: userBookId } = await params
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const [dbUser] = await db.select().from(users).where(eq(users.authId, authUser.id)).limit(1)
  if (!dbUser) redirect('/login')

  const [row] = await db
    .select()
    .from(userBooks)
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .where(and(eq(userBooks.id, userBookId), eq(userBooks.userId, dbUser.id)))
    .limit(1)

  if (!row) notFound()

  const { user_books: ub, books: book } = row

  // Latest progress
  const [latestProgress] = await db
    .select()
    .from(progressEntries)
    .where(eq(progressEntries.userBookId, userBookId))
    .orderBy(desc(progressEntries.loggedAt))
    .limit(1)

  // Recent sessions
  const sessions = await db
    .select()
    .from(readingSessions)
    .where(eq(readingSessions.userBookId, userBookId))
    .orderBy(desc(readingSessions.startedAt))
    .limit(10)

  // Active session (no endedAt)
  const activeSession = sessions.find((s) => !s.endedAt) ?? null

  // Review
  const [review] = await db
    .select()
    .from(reviews)
    .where(eq(reviews.userBookId, userBookId))
    .limit(1)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex gap-4">
        <div className="relative h-36 w-24 shrink-0 overflow-hidden rounded-md bg-muted shadow">
          {book.coverUrl ? (
            <Image src={book.coverUrl} alt={book.title} fill className="object-cover" sizes="96px" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground p-2 text-center">
              {book.title}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="text-xl font-bold leading-tight">{book.title}</h1>
          {book.subtitle && <p className="text-sm text-muted-foreground">{book.subtitle}</p>}
          <p className="text-sm text-muted-foreground">{book.authors.join(', ')}</p>
          {book.pageCount && <p className="text-xs text-muted-foreground">{book.pageCount} pages</p>}
          <div className="flex flex-wrap gap-1 pt-1">
            <Badge variant="secondary">{ub.shelf.replace('_', ' ')}</Badge>
            <Badge variant="outline">{ub.format}</Badge>
            {book.genres.slice(0, 2).map((g) => (
              <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
            ))}
          </div>
          <div className="pt-1">
            <ShelfActions userBookId={userBookId} currentShelf={ub.shelf} />
          </div>
        </div>
      </div>

      <Separator />

      {/* Progress */}
      {ub.shelf !== 'finished' && ub.shelf !== 'abandoned' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressForm
              userBookId={userBookId}
              pageCount={book.pageCount}
              currentPage={latestProgress?.page ?? null}
            />
          </CardContent>
        </Card>
      )}

      {/* Session timer */}
      {ub.shelf !== 'abandoned' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Reading session</CardTitle>
          </CardHeader>
          <CardContent>
            <SessionTimer
              userBookId={userBookId}
              currentPage={latestProgress?.page ?? null}
              activeSessionId={activeSession?.id ?? null}
              activeSessionStart={activeSession?.startedAt?.toISOString() ?? null}
            />
          </CardContent>
        </Card>
      )}

      {/* Recent sessions */}
      {sessions.filter((s) => s.endedAt).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Session history</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sessions.filter((s) => s.endedAt).map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{formatDate(s.startedAt.toISOString())}</span>
                  <span>{formatDuration(s.durationSeconds)}</span>
                  {s.pagesRead != null && (
                    <span className="text-muted-foreground">{s.pagesRead} pages</span>
                  )}
                  {s.pagesPerHour != null && (
                    <span className="text-muted-foreground">{Math.round(s.pagesPerHour)} p/hr</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rating & notes</CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewForm
            userBookId={userBookId}
            initialRating={review?.rating ?? null}
            initialBody={review?.body ?? null}
          />
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {ub.startedAt && <p><span className="text-muted-foreground">Started:</span> {formatDate(ub.startedAt)}</p>}
          {ub.finishedAt && <p><span className="text-muted-foreground">Finished:</span> {formatDate(ub.finishedAt)}</p>}
          {book.publisher && <p><span className="text-muted-foreground">Publisher:</span> {book.publisher}</p>}
          {book.publishedDate && <p><span className="text-muted-foreground">Published:</span> {book.publishedDate}</p>}
          {book.language && <p><span className="text-muted-foreground">Language:</span> {book.language.toUpperCase()}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
