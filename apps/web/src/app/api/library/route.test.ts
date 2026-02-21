import { describe, test, expect, vi } from 'vitest'
import { GET, POST } from './route'
import {
  TEST_AUTH_ID,
  mockVolume,
  insertTestBook,
  insertTestUserBook,
  db,
  books,
} from '@/tests/integration/db-helpers'
import { eq } from 'drizzle-orm'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: TEST_AUTH_ID } } }),
    },
  }),
}))

function makeReq(method: string, body?: unknown): Request {
  return new Request('http://test/api/library', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('POST /api/library', () => {
  test('adds a book and returns 201 with want_to_read shelf', async () => {
    const res = await POST(makeReq('POST', { volume: mockVolume, shelf: 'want_to_read' }))
    expect(res.status).toBe(201)
    const { data } = await res.json()
    expect(data.shelf).toBe('want_to_read')
  })

  test('same googleBooksId added twice → only one book row in DB', async () => {
    await POST(makeReq('POST', { volume: mockVolume, shelf: 'want_to_read' }))
    await POST(makeReq('POST', { volume: mockVolume, shelf: 'want_to_read' }))
    const rows = await db.select().from(books).where(eq(books.googleBooksId, mockVolume.id))
    expect(rows).toHaveLength(1)
  })

  test('missing volume → 400', async () => {
    const res = await POST(makeReq('POST', { shelf: 'want_to_read' }))
    expect(res.status).toBe(400)
  })

  test('invalid shelf value → 400', async () => {
    const res = await POST(makeReq('POST', { volume: mockVolume, shelf: 'invalid' }))
    expect(res.status).toBe(400)
  })
})

describe('GET /api/library', () => {
  test("returns only the authenticated user's books", async () => {
    const book = await insertTestBook()
    const { users } = await import('@readrise/db')
    const { eq: eqOp } = await import('drizzle-orm')
    const [user] = await db.select().from(users).where(eqOp(users.authId, TEST_AUTH_ID))
    await insertTestUserBook(user!.id, book.id, 'reading')

    const res = await GET(makeReq('GET'))
    expect(res.status).toBe(200)
    const { data } = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].books.id).toBe(book.id)
  })

  test('shelf filter returns only matching shelf', async () => {
    const book = await insertTestBook()
    const { users } = await import('@readrise/db')
    const { eq: eqOp } = await import('drizzle-orm')
    const [user] = await db.select().from(users).where(eqOp(users.authId, TEST_AUTH_ID))
    await insertTestUserBook(user!.id, book.id, 'finished')

    const req = new Request('http://test/api/library?shelf=reading', { method: 'GET' })
    const res = await GET(req)
    const { data } = await res.json()
    expect(data).toHaveLength(0)
  })
})
