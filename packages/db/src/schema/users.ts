import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const subscriptionTierEnum = pgEnum('subscription_tier', [
  'free',
  'reader',
  'bibliophile',
])

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'canceled',
  'past_due',
  'trialing',
])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  // auth.users.id from Supabase Auth — kept in sync via trigger
  authId: uuid('auth_id').notNull().unique(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  subscriptionTier: subscriptionTierEnum('subscription_tier').notNull().default('free'),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').notNull().default('active'),
  stripeCustomerId: text('stripe_customer_id').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
