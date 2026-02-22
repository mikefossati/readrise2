import { describe, test, expect } from 'vitest'
import { GET, POST } from './route'
import {
  TEST_AUTH_ID,
  db,
  users,
} from '@/tests/integration/db-helpers'
import { eq } from 'drizzle-orm'


const YEAR = 2026

function makePost(body: unknown): Request {
  return new Request('http://test/api/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeGet(year = YEAR): Request {
  return new Request(`http://test/api/goals?year=${year}`, { method: 'GET' })
}

describe('POST /api/goals', () => {
  test('creates a new goal and returns it', async () => {
    const res = await POST(makePost({ year: YEAR, target: 24, goalType: 'book_count' }))
    expect(res.status).toBe(200)
    const { data } = await res.json()
    expect(data.target).toBe(24)
    expect(data.year).toBe(YEAR)
  })

  test('second POST for same year updates target (upsert)', async () => {
    await POST(makePost({ year: YEAR, target: 12, goalType: 'book_count' }))
    const res = await POST(makePost({ year: YEAR, target: 52, goalType: 'book_count' }))
    const { data } = await res.json()
    expect(data.target).toBe(52)

    // Only one row for this year
    const { userGoals } = await import('@readrise/db')
    const [user] = await db.select().from(users).where(eq(users.authId, TEST_AUTH_ID))
    const rows = await db
      .select()
      .from(userGoals)
      .where(eq(userGoals.userId, user!.id))
    expect(rows).toHaveLength(1)
  })

  test('target missing returns 400', async () => {
    const res = await POST(makePost({ year: YEAR, goalType: 'book_count' }))
    expect(res.status).toBe(400)
  })
})

describe('GET /api/goals', () => {
  test('returns goal for the given year', async () => {
    await POST(makePost({ year: YEAR, target: 24, goalType: 'book_count' }))
    const res = await GET(makeGet(YEAR))
    const { data } = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].target).toBe(24)
  })

  test('returns empty array for year with no goal', async () => {
    const res = await GET(makeGet(1999))
    const { data } = await res.json()
    expect(data).toHaveLength(0)
  })
})
