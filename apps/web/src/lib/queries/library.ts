import { db, userBooks, books, progressEntries, reviews } from '@readrise/db'
import { eq, desc, inArray } from 'drizzle-orm'

/**
 * Fetches the full library for a user with progress and ratings in 3 queries
 * instead of the N+1 pattern (one query per reading/finished book).
 */
export async function getLibrary(userId: string) {
  const rows = await db
    .select()
    .from(userBooks)
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .where(eq(userBooks.userId, userId))
    .orderBy(desc(userBooks.updatedAt))

  const readingIds = rows
    .filter((r) => r.user_books.shelf === 'reading')
    .map((r) => r.user_books.id)

  const finishedIds = rows
    .filter((r) => r.user_books.shelf === 'finished')
    .map((r) => r.user_books.id)

  // Batch fetch latest progress for all reading books (one query, not N)
  const latestProgress: Record<string, number> = {}
  if (readingIds.length > 0) {
    const allProgress = await db
      .select()
      .from(progressEntries)
      .where(inArray(progressEntries.userBookId, readingIds))
      .orderBy(desc(progressEntries.loggedAt))
    for (const entry of allProgress) {
      // orderBy desc means first occurrence per userBookId is the latest
      if (!latestProgress[entry.userBookId]) latestProgress[entry.userBookId] = entry.page
    }
  }

  // Batch fetch ratings for all finished books (one query, not N)
  const ratings: Record<string, number> = {}
  if (finishedIds.length > 0) {
    const allReviews = await db
      .select()
      .from(reviews)
      .where(inArray(reviews.userBookId, finishedIds))
    for (const review of allReviews) ratings[review.userBookId] = review.rating
  }

  return { rows, latestProgress, ratings }
}
