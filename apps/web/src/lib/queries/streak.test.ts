import { describe, test, expect } from 'vitest'
import { db, readingSessions, userBooks, books } from '@readrise/db'
import { TEST_AUTH_ID } from '@/tests/integration/db-helpers'
import { eq } from 'drizzle-orm'
import { users } from '@readrise/db'

// Import getStreak fresh each test so React.cache() doesn't persist across tests
async function streak(userId: string) {
  // Reset module cache between calls by re-importing with a cache-bust param
  const { getStreak } = await import('./streak')
  return getStreak(userId)
}

async function getTestUser() {
  const [user] = await db.select().from(users).where(eq(users.authId, TEST_AUTH_ID))
  if (!user) throw new Error('Test user not found')
  return user
}

async function insertBook() {
  const [book] = await db
    .insert(books)
    .values({ googleBooksId: `streak-book-${Date.now()}`, title: 'Streak Book', authors: [], genres: [] })
    .returning()
  if (!book) throw new Error('Failed to insert book')
  return book
}

async function addSession(userBookId: string, startedAt: Date, endedAt: Date) {
  const durationSeconds = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)
  await db.insert(readingSessions).values({ userBookId, startedAt, endedAt, durationSeconds })
}

describe('getStreak', () => {
  test('returns 0 when user has no sessions', async () => {
    const user = await getTestUser()
    expect(await streak(user.id)).toBe(0)
  })

  test('returns correct streak for consecutive days', async () => {
    const user = await getTestUser()
    const book = await insertBook()
    const [ub] = await db
      .insert(userBooks)
      .values({ userId: user.id, bookId: book.id, shelf: 'reading' })
      .returning()
    if (!ub) throw new Error('Failed to insert user book')

    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    await addSession(ub.id, today, new Date(today.getTime() + 3600000))
    await addSession(ub.id, yesterday, new Date(yesterday.getTime() + 3600000))

    expect(await streak(user.id)).toBe(2)
  })

  test('returns 1 when only today has a session', async () => {
    const user = await getTestUser()
    const book = await insertBook()
    const [ub] = await db
      .insert(userBooks)
      .values({ userId: user.id, bookId: book.id, shelf: 'reading' })
      .returning()
    if (!ub) throw new Error('Failed to insert user book')

    const now = new Date()
    await addSession(ub.id, now, new Date(now.getTime() + 3600000))

    expect(await streak(user.id)).toBe(1)
  })

  test('streak resets after a gap day', async () => {
    const user = await getTestUser()
    const book = await insertBook()
    const [ub] = await db
      .insert(userBooks)
      .values({ userId: user.id, bookId: book.id, shelf: 'reading' })
      .returning()
    if (!ub) throw new Error('Failed to insert user book')

    const today = new Date()
    const twoDaysAgo = new Date(today)
    twoDaysAgo.setDate(today.getDate() - 2)

    // Session today and 2 days ago — yesterday is the gap
    await addSession(ub.id, today, new Date(today.getTime() + 3600000))
    await addSession(ub.id, twoDaysAgo, new Date(twoDaysAgo.getTime() + 3600000))

    expect(await streak(user.id)).toBe(1)
  })
})
