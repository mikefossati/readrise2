import { createClient } from '@/lib/supabase/server'
import { db, userBooks, books, progressEntries, reviews } from '@readrise/db'
import { eq, and, desc } from 'drizzle-orm'
import { users } from '@readrise/db'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookCard } from '@/components/books/book-card'
import { BookSearch } from '@/components/books/book-search'
import { GoodreadsImport } from '@/components/import/goodreads-import'
import { BookOpen } from 'lucide-react'

const SHELVES = [
  { value: 'reading', label: 'Reading' },
  { value: 'want_to_read', label: 'Want to Read' },
  { value: 'finished', label: 'Finished' },
  { value: 'abandoned', label: 'Abandoned' },
] as const

async function getLibrary(userId: string) {
  const rows = await db
    .select()
    .from(userBooks)
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .where(eq(userBooks.userId, userId))
    .orderBy(desc(userBooks.updatedAt))

  // Get latest page for reading books
  const readingIds = rows
    .filter((r) => r.user_books.shelf === 'reading')
    .map((r) => r.user_books.id)

  const latestProgress: Record<string, number> = {}
  for (const ubId of readingIds) {
    const [entry] = await db
      .select()
      .from(progressEntries)
      .where(eq(progressEntries.userBookId, ubId))
      .orderBy(desc(progressEntries.loggedAt))
      .limit(1)
    if (entry) latestProgress[ubId] = entry.page
  }

  // Get ratings for finished books
  const finishedIds = rows
    .filter((r) => r.user_books.shelf === 'finished')
    .map((r) => r.user_books.id)

  const ratings: Record<string, number> = {}
  for (const ubId of finishedIds) {
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.userBookId, ubId))
      .limit(1)
    if (review) ratings[ubId] = review.rating
  }

  return { rows, latestProgress, ratings }
}

export default async function LibraryPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const [dbUser] = await db.select().from(users).where(eq(users.authId, authUser.id)).limit(1)
  if (!dbUser) redirect('/login')

  const { rows, latestProgress, ratings } = await getLibrary(dbUser.id)

  const byShelf = (shelf: string) => rows.filter((r) => r.user_books.shelf === shelf)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Library</h1>
        <div className="flex gap-2">
          <GoodreadsImport />
          <BookSearch />
        </div>
      </div>

      <Tabs defaultValue="reading">
        <TabsList>
          {SHELVES.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                {byShelf(value).length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {SHELVES.map(({ value }) => (
          <TabsContent key={value} value={value} className="mt-4">
            {byShelf(value).length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
                <BookOpen className="h-10 w-10" />
                <p className="text-sm">No books here yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {byShelf(value).map(({ user_books: ub, books: book }) => (
                  <BookCard
                    key={ub.id}
                    userBookId={ub.id}
                    title={book.title}
                    authors={book.authors}
                    coverUrl={book.coverUrl}
                    shelf={ub.shelf}
                    pageCount={book.pageCount}
                    currentPage={latestProgress[ub.id]}
                    rating={ratings[ub.id]}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
