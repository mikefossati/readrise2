import { db, users, books, userBooks, progressEntries, readingSessions, reviews, userGoals } from '@readrise/db'
import { sql } from 'drizzle-orm'
import type { GoogleBooksVolume } from '@readrise/types'

// Stable UUID used as the mock Supabase auth user ID in all integration tests
export const TEST_AUTH_ID = '00000000-0000-0000-0000-000000000001'

export async function truncateAll() {
  await db.execute(sql`TRUNCATE TABLE users, books CASCADE`)
}

export async function seedTestUser() {
  const [user] = await db
    .insert(users)
    .values({
      authId: TEST_AUTH_ID,
      email: 'test@readrise.test',
      displayName: 'Test User',
    })
    .returning()
  if (!user) throw new Error('Failed to seed test user')
  return user
}

/** A realistic GoogleBooksVolume fixture for use in POST /api/library requests */
export const mockVolume: GoogleBooksVolume = {
  id: 'test-google-id-001',
  volumeInfo: {
    title: 'The Pragmatic Programmer',
    subtitle: 'Your Journey to Mastery',
    authors: ['David Thomas', 'Andrew Hunt'],
    description: 'A classic programming book.',
    pageCount: 352,
    imageLinks: {
      thumbnail: 'http://books.google.com/books/content?id=test&zoom=1',
    },
    categories: ['Computers'],
    publishedDate: '2019-09-23',
    publisher: 'Addison-Wesley',
    language: 'en',
    industryIdentifiers: [
      { type: 'ISBN_13', identifier: '9780135957059' },
      { type: 'ISBN_10', identifier: '0135957052' },
    ],
  },
}

export async function insertTestBook() {
  const [book] = await db
    .insert(books)
    .values({
      googleBooksId: mockVolume.id,
      title: mockVolume.volumeInfo.title,
      authors: mockVolume.volumeInfo.authors ?? [],
      genres: [],
    })
    .returning()
  if (!book) throw new Error('Failed to insert test book')
  return book
}

export async function insertTestUserBook(
  userId: string,
  bookId: string,
  shelf: 'reading' | 'want_to_read' | 'finished' | 'abandoned' = 'reading',
) {
  const [ub] = await db
    .insert(userBooks)
    .values({ userId, bookId, shelf })
    .returning()
  if (!ub) throw new Error('Failed to insert test userBook')
  return ub
}

export { db, users, books, userBooks, progressEntries, readingSessions, reviews, userGoals }
