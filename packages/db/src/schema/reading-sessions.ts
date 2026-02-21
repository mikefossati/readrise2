import { doublePrecision, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { userBooks } from './user-books'

export const readingSessions = pgTable('reading_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userBookId: uuid('user_book_id')
    .notNull()
    .references(() => userBooks.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  // Null while session is still active
  endedAt: timestamp('ended_at', { withTimezone: true }),
  durationSeconds: integer('duration_seconds'),
  pagesStart: integer('pages_start'),
  pagesEnd: integer('pages_end'),
  // Derived: pagesEnd - pagesStart
  pagesRead: integer('pages_read'),
  // Derived: (pagesRead / durationSeconds) * 3600
  pagesPerHour: doublePrecision('pages_per_hour'),
  note: text('note'),
})

export type ReadingSession = typeof readingSessions.$inferSelect
export type NewReadingSession = typeof readingSessions.$inferInsert
