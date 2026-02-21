import { NextResponse } from 'next/server'
import { db, books, userBooks } from '@readrise/db'
import { getAuthenticatedUser } from '@/lib/api-helpers'
import { getBookByIsbn, searchBooks, volumeToBookData } from '@/lib/google-books'

interface GoodreadsRow {
  'Title': string
  'Author': string
  'ISBN': string
  'ISBN13': string
  'My Rating': string
  'Date Read': string
  'Date Added': string
  'Bookshelves': string
  'Exclusive Shelf': string
  'My Review': string
  'Number of Pages': string
  'Read Count': string
}

function mapShelf(exclusiveShelf: string): 'reading' | 'want_to_read' | 'finished' | 'abandoned' {
  switch (exclusiveShelf?.toLowerCase()) {
    case 'read': return 'finished'
    case 'currently-reading': return 'reading'
    case 'to-read': return 'want_to_read'
    default: return 'want_to_read'
  }
}

// POST /api/import/goodreads — expects JSON array of Goodreads CSV rows
export async function POST(request: Request) {
  const { dbUser, error } = await getAuthenticatedUser()
  if (error) return error

  const body = await request.json()
  const rows: GoodreadsRow[] = body.rows

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
  }

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of rows.slice(0, 500)) { // cap at 500 to avoid timeouts
    try {
      const isbn = (row['ISBN13'] ?? row['ISBN'] ?? '').replace(/[^0-9X]/gi, '')
      const title = row['Title']?.trim()
      if (!title) { skipped++; continue }

      // Find or create canonical book
      let volume = isbn ? await getBookByIsbn(isbn) : null
      if (!volume) {
        const results = await searchBooks(`${title} ${row['Author'] ?? ''}`.trim(), 1)
        volume = results[0] ?? null
      }
      if (!volume) { skipped++; errors.push(`Not found: ${title}`); continue }

      const bookData = volumeToBookData(volume)

      const [book] = await db
        .insert(books)
        .values(bookData)
        .onConflictDoUpdate({
          target: books.googleBooksId,
          set: { title: bookData.title, coverUrl: bookData.coverUrl },
        })
        .returning()

      const shelf = mapShelf(row['Exclusive Shelf'])
      const rereadNumber = Math.max(0, parseInt(row['Read Count'] ?? '1') - 1)

      await db
        .insert(userBooks)
        .values({
          userId: dbUser!.id,
          bookId: book!.id,
          shelf,
          rereadNumber,
          startedAt: null,
          finishedAt: row['Date Read'] || null,
        })
        .onConflictDoNothing()

      imported++
    } catch (e) {
      skipped++
      errors.push(`Error: ${row['Title']} — ${e instanceof Error ? e.message : 'unknown'}`)
    }
  }

  return NextResponse.json({
    data: { imported, skipped, errors: errors.slice(0, 20) },
  })
}
