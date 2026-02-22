import { describe, test, expect } from 'vitest'
import { PATCH, DELETE } from './route'
import {
  TEST_AUTH_ID,
  insertTestBook,
  insertTestUserBook,
  db,
  userBooks,
  users,
} from '@/tests/integration/db-helpers'
import { eq } from 'drizzle-orm'


async function getTestUser() {
  const [user] = await db.select().from(users).where(eq(users.authId, TEST_AUTH_ID))
  return user!
}

async function setup() {
  const user = await getTestUser()
  const book = await insertTestBook()
  const ub = await insertTestUserBook(user.id, book.id, 'reading')
  return { user, book, ub }
}

function makeReq(method: string, body?: unknown): Request {
  return new Request('http://test/', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('PATCH /api/library/[userBookId]', () => {
  test('updates the shelf and persists to DB', async () => {
    const { ub } = await setup()
    const res = await PATCH(makeReq('PATCH', { shelf: 'finished' }), {
      params: Promise.resolve({ userBookId: ub.id }),
    })
    expect(res.status).toBe(200)
    const { data } = await res.json()
    expect(data.shelf).toBe('finished')

    const [row] = await db.select().from(userBooks).where(eq(userBooks.id, ub.id))
    expect(row?.shelf).toBe('finished')
  })

  test('wrong userBookId returns 404', async () => {
    const res = await PATCH(makeReq('PATCH', { shelf: 'finished' }), {
      params: Promise.resolve({ userBookId: '00000000-0000-0000-0000-000000000099' }),
    })
    expect(res.status).toBe(404)
  })

  test('invalid shelf value returns 400', async () => {
    const { ub } = await setup()
    const res = await PATCH(makeReq('PATCH', { shelf: 'invalid' }), {
      params: Promise.resolve({ userBookId: ub.id }),
    })
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/library/[userBookId]', () => {
  test('removes the userBook row', async () => {
    const { ub } = await setup()
    const res = await DELETE(makeReq('DELETE'), {
      params: Promise.resolve({ userBookId: ub.id }),
    })
    expect(res.status).toBe(200)
    const rows = await db.select().from(userBooks).where(eq(userBooks.id, ub.id))
    expect(rows).toHaveLength(0)
  })

  test('deleting a non-existent / wrong-user ID returns 200 (idempotent)', async () => {
    const res = await DELETE(makeReq('DELETE'), {
      params: Promise.resolve({ userBookId: '00000000-0000-0000-0000-000000000099' }),
    })
    expect(res.status).toBe(200)
  })
})
