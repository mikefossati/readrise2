import { describe, test, expect, vi, afterEach } from 'vitest'
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
    expect(data.book).toBeDefined()
    expect(data.book.title).toBe(mockVolume.volumeInfo.title)
  })

  test('same googleBooksId added twice → only one book row in DB', async () => {
    await POST(makeReq('POST', { volume: mockVolume, shelf: 'want_to_read' }))
    await POST(makeReq('POST', { volume: mockVolume, shelf: 'want_to_read' }))
    const rows = await db.select().from(books).where(eq(books.googleBooksId, mockVolume.id))
    expect(rows).toHaveLength(1)
  })

  test('volume_id (iOS snake_case) → fetches from Google Books → 201', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockVolume) }),
    )
    const res = await POST(makeReq('POST', { volume_id: mockVolume.id, shelf: 'reading' }))
    expect(res.status).toBe(201)
    const { data } = await res.json()
    expect(data.shelf).toBe('reading')
    expect(data.book.title).toBe(mockVolume.volumeInfo.title)
    vi.unstubAllGlobals()
  })

  test('volume_id not found on Google Books → 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const res = await POST(makeReq('POST', { volume_id: 'bad-id', shelf: 'reading' }))
    expect(res.status).toBe(404)
    vi.unstubAllGlobals()
  })

  test('missing volume and volume_id → 400', async () => {
    const res = await POST(makeReq('POST', { shelf: 'want_to_read' }))
    expect(res.status).toBe(400)
  })

  test('invalid shelf value → 400', async () => {
    const res = await POST(makeReq('POST', { volume: mockVolume, shelf: 'invalid' }))
    expect(res.status).toBe(400)
  })
})

describe('POST /api/library — book limit', () => {
  test('free user at 50-book limit → 409 BOOK_LIMIT_REACHED', async () => {
    const { users, userBooks: userBooksTable } = await import('@readrise/db')
    const { eq: eqOp } = await import('drizzle-orm')
    const [user] = await db.select().from(users).where(eqOp(users.authId, TEST_AUTH_ID))

    // Bulk-insert 50 unique books and corresponding user_books
    const booksData = Array.from({ length: 50 }, (_, i) => ({
      googleBooksId: `limit-test-book-${i}`,
      title: `Limit Book ${i}`,
      authors: ['Test Author'],
      genres: [],
    }))
    const inserted = await db.insert(books).values(booksData).returning()

    await db.insert(userBooksTable).values(
      inserted.map((b) => ({ userId: user!.id, bookId: b.id, shelf: 'want_to_read' as const })),
    )

    const res = await POST(makeReq('POST', { volume: mockVolume, shelf: 'want_to_read' }))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('BOOK_LIMIT_REACHED')
    expect(body.limit).toBe(50)
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
    expect(data[0]!.shelf).toBe('reading')
    expect(data[0]!.book.id).toBe(book.id)
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
