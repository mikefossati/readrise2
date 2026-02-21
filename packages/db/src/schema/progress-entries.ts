import { doublePrecision, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { userBooks } from './user-books'

export const progressEntries = pgTable('progress_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userBookId: uuid('user_book_id')
    .notNull()
    .references(() => userBooks.id, { onDelete: 'cascade' }),
  page: integer('page').notNull(),
  // 0.0–1.0, derived from page / book.pageCount
  percent: doublePrecision('percent').notNull(),
  loggedAt: timestamp('logged_at', { withTimezone: true }).notNull().defaultNow(),
  note: text('note'),
})

export type ProgressEntry = typeof progressEntries.$inferSelect
export type NewProgressEntry = typeof progressEntries.$inferInsert
