import { describe, test, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { TEST_AUTH_ID, db } from '@/tests/integration/db-helpers'
import { users } from '@readrise/db'
import { eq } from 'drizzle-orm'


vi.mock('@/lib/stripe', () => ({
  stripe: {
    customers: {
      create: vi.fn().mockResolvedValue({ id: 'cus_test_new' }),
    },
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test_session' }),
      },
    },
  },
}))

function makeReq(body?: unknown) {
  return new Request('http://test/api/billing/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('POST /api/billing/checkout', () => {
  beforeEach(() => vi.clearAllMocks())

  test('missing priceId → 400', async () => {
    const res = await POST(makeReq({}))
    expect(res.status).toBe(400)
  })

  test('no existing customer → creates stripe customer and returns checkout URL', async () => {
    const { stripe } = await import('@/lib/stripe')

    const res = await POST(makeReq({ priceId: 'price_test_reader_monthly' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe('https://checkout.stripe.com/test_session')
    expect(vi.mocked(stripe.customers.create)).toHaveBeenCalledOnce()
  })

  test('existing stripe customer → skips customer creation', async () => {
    const [user] = await db.select().from(users).where(eq(users.authId, TEST_AUTH_ID))
    await db.update(users).set({ stripeCustomerId: 'cus_existing_123' }).where(eq(users.id, user!.id))

    const { stripe } = await import('@/lib/stripe')

    const res = await POST(makeReq({ priceId: 'price_test_reader_monthly' }))
    expect(res.status).toBe(200)
    expect(vi.mocked(stripe.customers.create)).not.toHaveBeenCalled()
  })
})
