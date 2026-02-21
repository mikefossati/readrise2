import { date, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const books = pgTable('books', {
  id: uuid('id').primaryKey().defaultRandom(),
  googleBooksId: text('google_books_id').notNull().unique(),
  isbn10: text('isbn_10'),
  isbn13: text('isbn_13'),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  // stored as JSON array of strings
  authors: text('authors').array().notNull().default([]),
  description: text('description'),
  coverUrl: text('cover_url'),
  pageCount: integer('page_count'),
  // stored as JSON array of strings
  genres: text('genres').array().notNull().default([]),
  publishedDate: date('published_date'),
  publisher: text('publisher'),
  language: text('language'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Book = typeof books.$inferSelect
export type NewBook = typeof books.$inferInsert
