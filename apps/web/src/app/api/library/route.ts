import { NextResponse } from 'next/server'
import { db, books, userBooks } from '@readrise/db'
import { eq, and, count } from 'drizzle-orm'
import { getAuthenticatedUser } from '@/lib/api-helpers'
import { volumeToBookData } from '@/lib/google-books'
import { getBookLimit } from '@/lib/features'
import type { GoogleBooksVolume } from '@readrise/types'
import { z } from 'zod'

// GET /api/library?shelf=reading
export async function GET(request: Request) {
  const { dbUser, error } = await getAuthenticatedUser()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const shelf = searchParams.get('shelf')

  const conditions = [eq(userBooks.userId, dbUser!.id)]
  if (shelf) conditions.push(eq(userBooks.shelf, shelf as 'reading' | 'want_to_read' | 'finished' | 'abandoned'))

  const rows = await db
    .select()
    .from(userBooks)
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .where(and(...conditions))
    .orderBy(userBooks.updatedAt)

  return NextResponse.json({ data: rows })
}

const addBookSchema = z.object({
  volume: z.object({ id: z.string() }).passthrough(),
  shelf: z.enum(['reading', 'want_to_read', 'finished', 'abandoned']),
  format: z.enum(['physical', 'ebook', 'audiobook']).default('physical'),
})

// POST /api/library — add a book to the user's library
export async function POST(request: Request) {
  const { dbUser, error } = await getAuthenticatedUser()
  if (error) return error

  // Enforce per-tier book limit
  const limit = getBookLimit(dbUser!.subscriptionTier)
  if (limit !== null) {
    const countResult = await db
      .select({ value: count() })
      .from(userBooks)
      .where(eq(userBooks.userId, dbUser!.id))
    const bookCount = countResult[0]?.value ?? 0
    if (bookCount >= limit) {
      return NextResponse.json(
        { error: 'BOOK_LIMIT_REACHED', limit },
        { status: 409 },
      )
    }
  }

  const body = await request.json()
  const parsed = addBookSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { volume, shelf, format } = parsed.data
  const bookData = volumeToBookData(volume as unknown as GoogleBooksVolume)

  // Upsert the canonical book record
  const insertedBook = await db
    .insert(books)
    .values(bookData)
    .onConflictDoUpdate({
      target: books.googleBooksId,
      set: {
        title: bookData.title,
        coverUrl: bookData.coverUrl,
        authors: bookData.authors,
      },
    })
    .returning()

  const book = insertedBook[0]
  if (!book) return NextResponse.json({ error: 'Failed to insert book' }, { status: 500 })

  // Check if user already has this book (any reread)
  const existing = await db
    .select()
    .from(userBooks)
    .where(and(eq(userBooks.userId, dbUser!.id), eq(userBooks.bookId, book.id)))
    .orderBy(userBooks.rereadNumber)

  const rereadNumber = existing.length > 0 ? Math.max(...existing.map((r) => r.rereadNumber)) + 1 : 0

  // Only add if this is a new read (or first time adding)
  if (existing.length > 0 && shelf !== 'want_to_read') {
    // Move most recent to the new shelf instead of adding duplicate
    const latest = existing[existing.length - 1]
    const [updated] = await db
      .update(userBooks)
      .set({ shelf, format, updatedAt: new Date() })
      .where(eq(userBooks.id, latest!.id))
      .returning()
    return NextResponse.json({ data: updated }, { status: 200 })
  }

  const [userBook] = await db
    .insert(userBooks)
    .values({ userId: dbUser!.id, bookId: book.id, shelf, format, rereadNumber })
    .returning()

  return NextResponse.json({ data: userBook }, { status: 201 })
}
