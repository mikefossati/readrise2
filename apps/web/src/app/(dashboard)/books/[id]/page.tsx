import { createClient } from '@/lib/supabase/server'
import { db, userBooks, books, progressEntries, readingSessions, reviews, users } from '@readrise/db'
import { eq, and, desc } from 'drizzle-orm'
import { redirect, notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ProgressForm } from '@/components/reading/progress-form'
import { SessionTimer } from '@/components/reading/session-timer'
import { ReviewForm } from '@/components/reading/review-form'
import { formatDate, formatDuration } from '@/lib/format'
import { ShelfActions } from '@/components/books/shelf-actions'
import { ChevronLeft } from 'lucide-react'

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

  const currentPage = latestProgress?.page ?? null
  const percent = book.pageCount && currentPage ? Math.round((currentPage / book.pageCount) * 100) : null
  const completedSessions = sessions.filter((s) => s.endedAt)

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Back link */}
      <Link href="/library" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Library
      </Link>

      {/* Book header — parchment background */}
      <div className="-mx-4 rounded-xl bg-[#f0ebe0] px-5 py-5 dark:bg-[#252538] sm:mx-0">
        <div className="flex gap-5">
          <div className="relative h-44 w-[116px] shrink-0 overflow-hidden rounded-lg bg-muted shadow-md">
            {book.coverUrl ? (
              <Image src={book.coverUrl} alt={book.title} fill className="object-cover" sizes="116px" />
            ) : (
              <div className="flex h-full items-center justify-center p-2 text-center text-xs text-muted-foreground">
                {book.title}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className="font-display text-xl font-bold leading-tight">{book.title}</h1>
            {book.subtitle && <p className="text-sm text-muted-foreground">{book.subtitle}</p>}
            <p className="text-sm text-muted-foreground">{book.authors.join(', ')}</p>
            <p className="text-xs text-muted-foreground">
              {[book.pageCount ? `${book.pageCount} pages` : null, book.genres[0]].filter(Boolean).join(' · ')}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <ShelfActions userBookId={userBookId} currentShelf={ub.shelf} />
            </div>
            <div className="flex flex-wrap gap-1 pt-0.5">
              <Badge variant="outline" className="text-xs">{ub.format}</Badge>
              {book.genres.slice(0, 2).map((g) => (
                <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Session timer — amber-tinted, primary action zone */}
      {ub.shelf !== 'abandoned' && (
        <div className="rounded-xl bg-[#fef3e2] px-5 py-4 dark:bg-[#3d3928]">
          <SessionTimer
            userBookId={userBookId}
            currentPage={currentPage}
            activeSessionId={activeSession?.id ?? null}
            activeSessionStart={activeSession?.startedAt?.toISOString() ?? null}
          />
        </div>
      )}

      {/* Progress */}
      {ub.shelf !== 'finished' && ub.shelf !== 'abandoned' && (
        <div className="space-y-3">
          {percent != null && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{currentPage && book.pageCount ? `p. ${currentPage} / ${book.pageCount}` : `${percent}%`}</span>
              </div>
              <Progress value={percent} className="h-2" />
            </div>
          )}
          <ProgressForm
            userBookId={userBookId}
            pageCount={book.pageCount}
            currentPage={currentPage}
          />
        </div>
      )}

      {/* Session history */}
      {completedSessions.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-medium">Session history</p>
          <div className="space-y-1">
            {completedSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm even:bg-muted/50">
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
        </div>
      )}

      {/* Rating & notes */}
      <div>
        <p className="mb-3 text-sm font-medium">Rating & notes</p>
        <ReviewForm
          userBookId={userBookId}
          initialRating={review?.rating ?? null}
          initialBody={review?.body ?? null}
        />
      </div>

      {/* Details */}
      {(ub.startedAt || ub.finishedAt || book.publisher || book.publishedDate || book.language) && (
        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Details</p>
          {ub.startedAt && <p>Started: {formatDate(ub.startedAt)}</p>}
          {ub.finishedAt && <p>Finished: {formatDate(ub.finishedAt)}</p>}
          {book.publisher && <p>Publisher: {book.publisher}</p>}
          {book.publishedDate && <p>Published: {book.publishedDate}</p>}
          {book.language && <p>Language: {book.language.toUpperCase()}</p>}
        </div>
      )}
    </div>
  )
}
