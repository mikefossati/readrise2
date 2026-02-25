import { describe, test, expect } from 'vitest'
import { getLibrary } from './library'
import { db, books, userBooks, progressEntries, reviews } from '@readrise/db'
import { TEST_AUTH_ID } from '@/tests/integration/db-helpers'
import { eq } from 'drizzle-orm'
import { users } from '@readrise/db'

async function getTestUser() {
  const [user] = await db.select().from(users).where(eq(users.authId, TEST_AUTH_ID))
  if (!user) throw new Error('Test user not found')
  return user
}

async function insertBook(googleBooksId: string) {
  const [book] = await db
    .insert(books)
    .values({ googleBooksId, title: `Book ${googleBooksId}`, authors: ['Author'], genres: [] })
    .returning()
  if (!book) throw new Error('Failed to insert book')
  return book
}

describe('getLibrary', () => {
  test('returns empty collections when user has no books', async () => {
    const user = await getTestUser()
    const result = await getLibrary(user.id)
    expect(result.rows).toHaveLength(0)
    expect(result.latestProgress).toEqual({})
    expect(result.ratings).toEqual({})
  })

  test('batches progress queries — latestProgress has correct page per reading book', async () => {
    const user = await getTestUser()
    const book1 = await insertBook('gb-reading-1')
    const book2 = await insertBook('gb-reading-2')

    const [ub1] = await db
      .insert(userBooks)
      .values({ userId: user.id, bookId: book1.id, shelf: 'reading' })
      .returning()
    const [ub2] = await db
      .insert(userBooks)
      .values({ userId: user.id, bookId: book2.id, shelf: 'reading' })
      .returning()
    if (!ub1 || !ub2) throw new Error('Failed to insert user books')

    // Two progress entries for ub1 — latest (by loggedAt) should win
    await db.insert(progressEntries).values([
      { userBookId: ub1.id, page: 50, percent: 0.25, loggedAt: new Date('2024-01-01T10:00:00Z') },
      { userBookId: ub1.id, page: 120, percent: 0.6, loggedAt: new Date('2024-01-02T10:00:00Z') },
    ])
    await db.insert(progressEntries).values([{ userBookId: ub2.id, page: 30, percent: 0.15 }])

    const result = await getLibrary(user.id)

    expect(result.latestProgress[ub1.id]).toBe(120)
    expect(result.latestProgress[ub2.id]).toBe(30)
  })

  test('batches ratings queries — ratings has correct value per finished book', async () => {
    const user = await getTestUser()
    const book1 = await insertBook('gb-finished-1')
    const book2 = await insertBook('gb-finished-2')

    const [ub1] = await db
      .insert(userBooks)
      .values({ userId: user.id, bookId: book1.id, shelf: 'finished' })
      .returning()
    const [ub2] = await db
      .insert(userBooks)
      .values({ userId: user.id, bookId: book2.id, shelf: 'finished' })
      .returning()
    if (!ub1 || !ub2) throw new Error('Failed to insert user books')

    await db.insert(reviews).values({ userBookId: ub1.id, rating: 4.5 })
    await db.insert(reviews).values({ userBookId: ub2.id, rating: 3.0 })

    const result = await getLibrary(user.id)

    expect(result.ratings[ub1.id]).toBe(4.5)
    expect(result.ratings[ub2.id]).toBe(3.0)
  })

  test('finished books without reviews are not in ratings map', async () => {
    const user = await getTestUser()
    const book = await insertBook('gb-no-review')
    const [ub] = await db
      .insert(userBooks)
      .values({ userId: user.id, bookId: book.id, shelf: 'finished' })
      .returning()
    if (!ub) throw new Error('Failed to insert user book')

    const result = await getLibrary(user.id)

    expect(result.ratings[ub.id]).toBeUndefined()
  })
})
