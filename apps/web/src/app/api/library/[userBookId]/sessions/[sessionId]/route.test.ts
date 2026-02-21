import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { PATCH } from './route'
import {
  TEST_AUTH_ID,
  insertTestBook,
  insertTestUserBook,
  db,
  users,
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

// Fix the system clock so durationSeconds is deterministic
const SESSION_START = new Date('2024-06-15T10:00:00.000Z')
const SESSION_END = new Date('2024-06-15T10:05:00.000Z') // 300 seconds later

beforeEach(() => {
  vi.setSystemTime(SESSION_END)
})
afterEach(() => {
  vi.useRealTimers()
})

async function setup() {
  const [user] = await db.select().from(users).where(eq(users.authId, TEST_AUTH_ID))
  const book = await insertTestBook()
  const ub = await insertTestUserBook(user!.id, book.id, 'reading')
  const [session] = await db
    .insert(readingSessions)
    .values({ userBookId: ub.id, startedAt: SESSION_START, pagesStart: 100 })
    .returning()
  return { user: user!, ub, session: session! }
}

function makeReq(body?: unknown): Request {
  return new Request('http://test/', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
}

describe('PATCH /api/library/[userBookId]/sessions/[sessionId]', () => {
  test('calculates durationSeconds correctly (300 seconds)', async () => {
    const { ub, session } = await setup()
    const res = await PATCH(makeReq({ pagesEnd: 150 }), {
      params: Promise.resolve({ userBookId: ub.id, sessionId: session.id }),
    })
    expect(res.status).toBe(200)
    const { data } = await res.json()
    expect(data.durationSeconds).toBe(300)
  })

  test('calculates pagesRead as pagesEnd - pagesStart', async () => {
    const { ub, session } = await setup()
    const res = await PATCH(makeReq({ pagesEnd: 150 }), {
      params: Promise.resolve({ userBookId: ub.id, sessionId: session.id }),
    })
    const { data } = await res.json()
    expect(data.pagesRead).toBe(50) // 150 - 100
  })

  test('calculates pagesPerHour correctly (50 pages / 5 min = 600 p/hr)', async () => {
    const { ub, session } = await setup()
    const res = await PATCH(makeReq({ pagesEnd: 150 }), {
      params: Promise.resolve({ userBookId: ub.id, sessionId: session.id }),
    })
    const { data } = await res.json()
    // 50 pages / (300s / 3600s) = 50 * 12 = 600
    expect(Math.round(data.pagesPerHour)).toBe(600)
  })

  test('endedAt is set on the session', async () => {
    const { ub, session } = await setup()
    await PATCH(makeReq({ pagesEnd: 120 }), {
      params: Promise.resolve({ userBookId: ub.id, sessionId: session.id }),
    })
    const [row] = await db
      .select()
      .from(readingSessions)
      .where(eq(readingSessions.id, session.id))
    expect(row?.endedAt).not.toBeNull()
  })

  test('wrong userBookId returns 404', async () => {
    const { session } = await setup()
    const res = await PATCH(makeReq({ pagesEnd: 120 }), {
      params: Promise.resolve({
        userBookId: '00000000-0000-0000-0000-000000000099',
        sessionId: session.id,
      }),
    })
    expect(res.status).toBe(404)
  })
})
