import { describe, test, expect } from 'vitest'
import { POST } from './route'
import { TEST_AUTH_ID, db } from '@/tests/integration/db-helpers'
import { users } from '@readrise/db'
import { eq } from 'drizzle-orm'


describe('POST /api/user/onboarding', () => {
  test('sets onboardingCompletedAt on the user', async () => {
    const before = (await db.select().from(users).where(eq(users.authId, TEST_AUTH_ID)))[0]
    expect(before?.onboardingCompletedAt).toBeNull()

    const res = await POST()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)

    const after = (await db.select().from(users).where(eq(users.authId, TEST_AUTH_ID)))[0]
    expect(after?.onboardingCompletedAt).not.toBeNull()
    expect(after?.onboardingCompletedAt).toBeInstanceOf(Date)
  })
})
