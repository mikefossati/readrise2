import { describe, test, expect, vi } from 'vitest'
import { PUT } from './route'
import {
  TEST_AUTH_ID,
  insertTestBook,
  insertTestUserBook,
  db,
  users,
  reviews,
} from '@/tests/integration/db-helpers'
import { eq } from 'drizzle-orm'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: TEST_AUTH_ID } } }),
    },
  }),
}))

async function setup() {
  const [user] = await db.select().from(users).where(eq(users.authId, TEST_AUTH_ID))
  const book = await insertTestBook()
  const ub = await insertTestUserBook(user!.id, book.id, 'finished')
  return { user: user!, book, ub }
}

function makeReq(body: unknown): Request {
  return new Request('http://test/', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PUT /api/library/[userBookId]/review', () => {
  test('inserts a review and returns it', async () => {
    const { ub } = await setup()
    const res = await PUT(makeReq({ rating: 4.5, body: 'Great book!' }), {
      params: Promise.resolve({ userBookId: ub.id }),
    })
    expect(res.status).toBe(200)
    const { data } = await res.json()
    expect(data.rating).toBe(4.5)
    expect(data.body).toBe('Great book!')
  })

  test('second PUT upserts (updates) existing review', async () => {
    const { ub } = await setup()
    await PUT(makeReq({ rating: 3 }), { params: Promise.resolve({ userBookId: ub.id }) })
    const res = await PUT(makeReq({ rating: 5, body: 'Changed my mind' }), {
      params: Promise.resolve({ userBookId: ub.id }),
    })
    expect(res.status).toBe(200)
    const { data } = await res.json()
    expect(data.rating).toBe(5)

    // Only one review row exists
    const rows = await db.select().from(reviews).where(eq(reviews.userBookId, ub.id))
    expect(rows).toHaveLength(1)
  })

  test('rating below 1 returns 400', async () => {
    const { ub } = await setup()
    const res = await PUT(makeReq({ rating: 0.5 }), {
      params: Promise.resolve({ userBookId: ub.id }),
    })
    expect(res.status).toBe(400)
  })

  test('rating above 5 returns 400', async () => {
    const { ub } = await setup()
    const res = await PUT(makeReq({ rating: 6 }), {
      params: Promise.resolve({ userBookId: ub.id }),
    })
    expect(res.status).toBe(400)
  })

  test('wrong userBookId returns 404', async () => {
    const res = await PUT(makeReq({ rating: 4 }), {
      params: Promise.resolve({ userBookId: '00000000-0000-0000-0000-000000000099' }),
    })
    expect(res.status).toBe(404)
  })
})
