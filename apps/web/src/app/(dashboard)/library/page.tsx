import { createClient } from '@/lib/supabase/server'
import { db, users } from '@readrise/db'
import { eq } from 'drizzle-orm'
import { getLibrary } from '@/lib/queries/library'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookCard } from '@/components/books/book-card'
import { BookSearch } from '@/components/books/book-search'
import { GoodreadsImport } from '@/components/import/goodreads-import'
import { BookOpen, Plus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'

const TAB_SHELVES = [
  { value: 'want_to_read', label: 'Want to Read' },
  { value: 'finished', label: 'Finished' },
  { value: 'abandoned', label: 'Abandoned' },
] as const

export default async function LibraryPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const [dbUser] = await db.select().from(users).where(eq(users.authId, authUser.id)).limit(1)
  if (!dbUser) redirect('/login')

  const { rows, latestProgress, ratings } = await getLibrary(dbUser.id)

  const byShelf = (shelf: string) => rows.filter((r) => r.user_books.shelf === shelf)
  const nowReading = byShelf('reading')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight">Library</h1>
        <div className="flex gap-2">
          <GoodreadsImport />
          <BookSearch />
        </div>
      </div>

      {/* Now Reading — featured band */}
      {nowReading.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-medium text-muted-foreground">Now Reading</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {nowReading.map(({ user_books: ub, books: book }) => {
              const page = latestProgress[ub.id] ?? null
              const percent = book.pageCount && page ? Math.round((page / book.pageCount) * 100) : null
              return (
                <Link
                  key={ub.id}
                  href={`/books/${ub.id}`}
                  className="group relative flex gap-4 overflow-hidden rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
                >
                  <div className="relative h-28 w-[72px] shrink-0 overflow-hidden rounded bg-muted shadow-sm">
                    {book.coverUrl ? (
                      <Image
                        src={book.coverUrl}
                        alt={book.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="72px"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="line-clamp-2 text-sm font-semibold leading-tight transition-colors group-hover:text-primary">
                      {book.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{book.authors[0]}</p>
                    {percent != null && (
                      <div className="space-y-1 pt-1">
                        <Progress value={percent} className="h-1.5" />
                        <p className="text-xs text-muted-foreground">
                          {page && book.pageCount ? `p. ${page} / ${book.pageCount}` : `${percent}%`}
                        </p>
                      </div>
                    )}
                    <p className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Continue reading →
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Shelf tabs — Want to Read / Finished / Abandoned */}
      <Tabs defaultValue="want_to_read">
        <TabsList>
          {TAB_SHELVES.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                {byShelf(value).length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {TAB_SHELVES.map(({ value }) => {
          const shelfBooks = byShelf(value)
          return (
            <TabsContent key={value} value={value} className="mt-4">
              {shelfBooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
                  <BookOpen className="h-10 w-10" />
                  <p className="text-sm font-medium">
                    {value === 'want_to_read' && 'Your reading queue is empty'}
                    {value === 'finished' && 'No finished books yet'}
                    {value === 'abandoned' && 'No abandoned books'}
                  </p>
                  <p className="text-xs">
                    {value === 'want_to_read' && 'Search for books and add them to your queue.'}
                    {value === 'finished' && 'Books you mark as finished will appear here.'}
                    {value === 'abandoned' && "Books you've set aside will appear here."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {shelfBooks.map(({ user_books: ub, books: book }) => (
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
                  {/* Add book ghost card */}
                  <BookSearch
                    trigger={
                      <button className="flex aspect-[2/3] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                        <Plus className="h-6 w-6" />
                        <span className="text-xs font-medium">Add book</span>
                      </button>
                    }
                  />
                </div>
              )}
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
