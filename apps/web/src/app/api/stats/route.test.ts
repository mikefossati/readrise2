import { describe, test, expect, vi } from 'vitest'
import { GET } from './route'
import {
  TEST_AUTH_ID,
  insertTestBook,
  insertTestUserBook,
  db,
  users,
  userBooks,
  readingSessions,
} from '@/tests/integration/db-helpers'
import { eq } from 'drizzle-orm'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: TEST_AUTH_ID } } }),
    },
  }),
}))

const THIS_YEAR = new Date().getFullYear()

async function getUser() {
  const [user] = await db.select().from(users).where(eq(users.authId, TEST_AUTH_ID))
  return user!
}

describe('GET /api/stats', () => {
  test('booksReadThisYear counts finished books with a finishedAt in the current year', async () => {
    const user = await getUser()
    const book = await insertTestBook()
    await db.insert(userBooks).values({
      userId: user.id,
      bookId: book.id,
      shelf: 'finished',
      finishedAt: `${THIS_YEAR}-03-01`,
    })

    const res = await GET()
    const { data } = await res.json()
    expect(data.booksReadThisYear).toBe(1)
  })

  test('booksReadThisYear does not count books finished in a previous year', async () => {
    const user = await getUser()
    const book = await insertTestBook()
    await db.insert(userBooks).values({
      userId: user.id,
      bookId: book.id,
      shelf: 'finished',
      finishedAt: `${THIS_YEAR - 1}-12-31`,
    })

    const res = await GET()
    const { data } = await res.json()
    expect(data.booksReadThisYear).toBe(0)
  })

  test('totalPagesAllTime sums pagesRead across all completed sessions', async () => {
    const user = await getUser()
    const book = await insertTestBook()
    const ub = await insertTestUserBook(user.id, book.id, 'reading')

    await db.insert(readingSessions).values([
      {
        userBookId: ub.id,
        startedAt: new Date('2024-01-01T09:00:00Z'),
        endedAt: new Date('2024-01-01T10:00:00Z'),
        pagesRead: 40,
        durationSeconds: 3600,
        pagesStart: 0,
        pagesEnd: 40,
      },
      {
        userBookId: ub.id,
        startedAt: new Date('2024-01-02T09:00:00Z'),
        endedAt: new Date('2024-01-02T10:00:00Z'),
        pagesRead: 60,
        durationSeconds: 3600,
        pagesStart: 40,
        pagesEnd: 100,
      },
    ])

    const res = await GET()
    const { data } = await res.json()
    expect(data.totalPagesAllTime).toBe(100)
  })

  test('streak calculates correctly from seeded session days', async () => {
    const user = await getUser()
    const book = await insertTestBook()
    const ub = await insertTestUserBook(user.id, book.id, 'reading')

    // Seed 3 consecutive days ending today
    const today = new Date()
    const makeDay = (daysAgo: number) => {
      const d = new Date(today)
      d.setDate(d.getDate() - daysAgo)
      d.setUTCHours(10, 0, 0, 0)
      return d
    }

    await db.insert(readingSessions).values([
      { userBookId: ub.id, startedAt: makeDay(0), endedAt: makeDay(0), durationSeconds: 1800 },
      { userBookId: ub.id, startedAt: makeDay(1), endedAt: makeDay(1), durationSeconds: 1800 },
      { userBookId: ub.id, startedAt: makeDay(2), endedAt: makeDay(2), durationSeconds: 1800 },
    ])

    const res = await GET()
    const { data } = await res.json()
    expect(data.streak.currentStreak).toBe(3)
    expect(data.streak.longestStreak).toBe(3)
  })

  test('returns 200 with valid shape even with no data', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const { data } = await res.json()
    expect(data).toHaveProperty('booksReadThisYear')
    expect(data).toHaveProperty('totalPagesAllTime')
    expect(data).toHaveProperty('streak')
    expect(data.streak).toHaveProperty('currentStreak')
  })
})
