import { describe, test, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { TEST_AUTH_ID, db } from '@/tests/integration/db-helpers'
import { users } from '@readrise/db'
import { eq } from 'drizzle-orm'

const STRIPE_CUSTOMER_ID = 'cus_webhook_test_001'


vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    subscriptions: {
      retrieve: vi.fn().mockResolvedValue({
        items: { data: [{ price: { id: 'price_reader_mo' } }] },
      }),
    },
  },
}))

// Control priceIdToTier output independently of env vars
vi.mock('@/lib/features', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/features')>()
  return {
    ...actual,
    priceIdToTier: vi.fn((id: string) => (id === 'price_reader_mo' ? 'reader' : 'free')),
  }
})

function makeWebhookReq(rawBody: string) {
  return new Request('http://test/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': 'sig_test' },
    body: rawBody,
  })
}

describe('POST /api/webhooks/stripe', () => {
  beforeEach(async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret'
    vi.clearAllMocks()
    // Set stripeCustomerId on the test user so webhook updates can find them
    const [user] = await db.select().from(users).where(eq(users.authId, TEST_AUTH_ID))
    await db
      .update(users)
      .set({ stripeCustomerId: STRIPE_CUSTOMER_ID })
      .where(eq(users.id, user!.id))
  })

  test('missing stripe-signature header → 400', async () => {
    const req = new Request('http://test/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  test('invalid signature → 400', async () => {
    const { stripe } = await import('@/lib/stripe')
    vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
      throw new Error('Invalid signature')
    })
    const res = await POST(makeWebhookReq('{}'))
    expect(res.status).toBe(400)
  })

  test('checkout.session.completed → sets tier to reader and status to active', async () => {
    const { stripe } = await import('@/lib/stripe')
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: STRIPE_CUSTOMER_ID,
          subscription: 'sub_test_001',
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const res = await POST(makeWebhookReq('{}'))
    expect(res.status).toBe(200)

    const [updated] = await db.select().from(users).where(eq(users.authId, TEST_AUTH_ID))
    expect(updated?.subscriptionTier).toBe('reader')
    expect(updated?.subscriptionStatus).toBe('active')
  })

  test('customer.subscription.deleted → resets to free / canceled', async () => {
    const { stripe } = await import('@/lib/stripe')
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: { customer: STRIPE_CUSTOMER_ID } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const res = await POST(makeWebhookReq('{}'))
    expect(res.status).toBe(200)

    const [updated] = await db.select().from(users).where(eq(users.authId, TEST_AUTH_ID))
    expect(updated?.subscriptionTier).toBe('free')
    expect(updated?.subscriptionStatus).toBe('canceled')
  })

  test('invoice.payment_failed → sets status to past_due', async () => {
    const { stripe } = await import('@/lib/stripe')
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'invoice.payment_failed',
      data: { object: { customer: STRIPE_CUSTOMER_ID } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const res = await POST(makeWebhookReq('{}'))
    expect(res.status).toBe(200)

    const [updated] = await db.select().from(users).where(eq(users.authId, TEST_AUTH_ID))
    expect(updated?.subscriptionStatus).toBe('past_due')
  })

  test('unknown event type → 200 (no-op)', async () => {
    const { stripe } = await import('@/lib/stripe')
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'payment_intent.created',
      data: { object: {} },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const res = await POST(makeWebhookReq('{}'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)
  })
})
