import { describe, test, expect } from 'vitest'
import { POST } from './route'
import {
  TEST_AUTH_ID,
  insertTestBook,
  insertTestUserBook,
  db,
  users,
  userBooks,
  progressEntries,
} from '@/tests/integration/db-helpers'
import { eq } from 'drizzle-orm'


async function setup(shelf: 'reading' | 'want_to_read' = 'reading') {
  const [user] = await db.select().from(users).where(eq(users.authId, TEST_AUTH_ID))
  const book = await insertTestBook()
  const ub = await insertTestUserBook(user!.id, book.id, shelf)
  return { user: user!, book, ub }
}

function makeReq(body: unknown): Request {
  return new Request('http://test/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/library/[userBookId]/progress', () => {
  test('logs a progress entry', async () => {
    const { ub } = await setup()
    const res = await POST(makeReq({ page: 120, pageCount: 352 }), {
      params: Promise.resolve({ userBookId: ub.id }),
    })
    expect(res.status).toBe(201)

    const entries = await db
      .select()
      .from(progressEntries)
      .where(eq(progressEntries.userBookId, ub.id))
    expect(entries).toHaveLength(1)
    expect(entries[0]?.page).toBe(120)
  })

  test('auto-promotes want_to_read → reading on first progress entry', async () => {
    const { ub } = await setup('want_to_read')
    await POST(makeReq({ page: 10, pageCount: 300 }), {
      params: Promise.resolve({ userBookId: ub.id }),
    })

    const [row] = await db.select().from(userBooks).where(eq(userBooks.id, ub.id))
    expect(row?.shelf).toBe('reading')
  })

  test('reading book stays on reading shelf', async () => {
    const { ub } = await setup('reading')
    await POST(makeReq({ page: 50, pageCount: 300 }), {
      params: Promise.resolve({ userBookId: ub.id }),
    })
    const [row] = await db.select().from(userBooks).where(eq(userBooks.id, ub.id))
    expect(row?.shelf).toBe('reading')
  })

  test('missing page field returns 400', async () => {
    const { ub } = await setup()
    const res = await POST(makeReq({ pageCount: 300 }), {
      params: Promise.resolve({ userBookId: ub.id }),
    })
    expect(res.status).toBe(400)
  })

  test('wrong userBookId returns 404', async () => {
    const res = await POST(makeReq({ page: 10 }), {
      params: Promise.resolve({ userBookId: '00000000-0000-0000-0000-000000000099' }),
    })
    expect(res.status).toBe(404)
  })
})
