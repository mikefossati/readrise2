import { describe, test, expect, vi } from 'vitest'
import { POST } from './route'
import { TEST_AUTH_ID, db } from '@/tests/integration/db-helpers'
import { users } from '@readrise/db'
import { eq } from 'drizzle-orm'


vi.mock('@/lib/stripe', () => ({
  stripe: {
    billingPortal: {
      sessions: {
        create: vi.fn().mockResolvedValue({ url: 'https://billing.stripe.com/test_portal' }),
      },
    },
  },
}))

describe('POST /api/billing/portal', () => {
  test('user has no stripe customer → 404', async () => {
    const res = await POST()
    expect(res.status).toBe(404)
  })

  test('user has stripe customer → returns portal URL', async () => {
    const [user] = await db.select().from(users).where(eq(users.authId, TEST_AUTH_ID))
    await db.update(users).set({ stripeCustomerId: 'cus_portal_test' }).where(eq(users.id, user!.id))

    const res = await POST()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe('https://billing.stripe.com/test_portal')
  })
})
