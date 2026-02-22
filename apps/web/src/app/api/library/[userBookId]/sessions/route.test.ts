import { describe, test, expect } from 'vitest'
import { POST } from './route'
import {
  TEST_AUTH_ID,
  insertTestBook,
  insertTestUserBook,
  db,
  users,
  readingSessions,
} from '@/tests/integration/db-helpers'
import { eq } from 'drizzle-orm'


async function setup() {
  const [user] = await db.select().from(users).where(eq(users.authId, TEST_AUTH_ID))
  const book = await insertTestBook()
  const ub = await insertTestUserBook(user!.id, book.id, 'reading')
  return { user: user!, book, ub }
}

function makeReq(body?: unknown): Request {
  return new Request('http://test/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
}

describe('POST /api/library/[userBookId]/sessions', () => {
  test('creates a new session and returns 201', async () => {
    const { ub } = await setup()
    const res = await POST(makeReq({ pagesStart: 50 }), {
      params: Promise.resolve({ userBookId: ub.id }),
    })
    expect(res.status).toBe(201)
    const { data } = await res.json()
    expect(data.userBookId).toBe(ub.id)
    expect(data.endedAt).toBeNull()
  })

  test('closes any existing open session before creating a new one', async () => {
    const { ub } = await setup()

    // Create first session
    await POST(makeReq({ pagesStart: 0 }), {
      params: Promise.resolve({ userBookId: ub.id }),
    })

    // Open sessions before second POST
    const openBefore = await db
      .select()
      .from(readingSessions)
      .where(eq(readingSessions.userBookId, ub.id))
    expect(openBefore.filter((s) => !s.endedAt)).toHaveLength(1)

    // Create second session — should close the first
    await POST(makeReq({ pagesStart: 10 }), {
      params: Promise.resolve({ userBookId: ub.id }),
    })

    const allSessions = await db
      .select()
      .from(readingSessions)
      .where(eq(readingSessions.userBookId, ub.id))
    expect(allSessions).toHaveLength(2)
    const open = allSessions.filter((s) => !s.endedAt)
    expect(open).toHaveLength(1) // only the newest is still open
  })

  test('wrong userBookId returns 404', async () => {
    const res = await POST(makeReq(), {
      params: Promise.resolve({ userBookId: '00000000-0000-0000-0000-000000000099' }),
    })
    expect(res.status).toBe(404)
  })
})
