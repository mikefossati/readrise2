import { boolean, doublePrecision, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { userBooks } from './user-books'

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  userBookId: uuid('user_book_id')
    .notNull()
    .unique()
    .references(() => userBooks.id, { onDelete: 'cascade' }),
  // 1.0–5.0, 0.5 increments
  rating: doublePrecision('rating').notNull(),
  body: text('body'),
  isPublic: boolean('is_public').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Review = typeof reviews.$inferSelect
export type NewReview = typeof reviews.$inferInsert
