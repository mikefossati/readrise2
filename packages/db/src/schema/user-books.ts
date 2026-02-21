import { date, integer, pgEnum, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { books } from './books'
import { users } from './users'

export const shelfEnum = pgEnum('shelf', [
  'reading',
  'want_to_read',
  'finished',
  'abandoned',
])

export const bookFormatEnum = pgEnum('book_format', ['physical', 'ebook', 'audiobook'])

export const userBooks = pgTable(
  'user_books',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    bookId: uuid('book_id')
      .notNull()
      .references(() => books.id, { onDelete: 'restrict' }),
    shelf: shelfEnum('shelf').notNull(),
    format: bookFormatEnum('format').notNull().default('physical'),
    startedAt: date('started_at'),
    finishedAt: date('finished_at'),
    abandonedAt: date('abandoned_at'),
    // 0 = first read, 1 = first reread, etc.
    rereadNumber: integer('reread_number').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // One row per user per book per reread instance
    unique('user_books_unique').on(t.userId, t.bookId, t.rereadNumber),
  ]
)

export type UserBook = typeof userBooks.$inferSelect
export type NewUserBook = typeof userBooks.$inferInsert
