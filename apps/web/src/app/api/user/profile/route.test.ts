import { describe, test, expect } from 'vitest'
import { GET, PATCH } from './route'
import { TEST_AUTH_ID, db } from '@/tests/integration/db-helpers'
import { users } from '@readrise/db'
import { eq } from 'drizzle-orm'


function makePatch(body: unknown) {
  return new Request('http://test/api/user/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('GET /api/user/profile', () => {
  test('returns displayName and avatarUrl', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.displayName).toBe('Test User')
    expect(body.data).toHaveProperty('avatarUrl')
  })
})

describe('PATCH /api/user/profile', () => {
  test('updates displayName', async () => {
    const res = await PATCH(makePatch({ displayName: 'Updated Name' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.displayName).toBe('Updated Name')

    const [dbUser] = await db.select().from(users).where(eq(users.authId, TEST_AUTH_ID))
    expect(dbUser?.displayName).toBe('Updated Name')
  })

  test('empty displayName → 400', async () => {
    const res = await PATCH(makePatch({ displayName: '' }))
    expect(res.status).toBe(400)
  })

  test('missing displayName → 400', async () => {
    const res = await PATCH(makePatch({}))
    expect(res.status).toBe(400)
  })
})
