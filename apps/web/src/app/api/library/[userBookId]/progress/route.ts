import { NextResponse } from 'next/server'
import { db, progressEntries, userBooks } from '@readrise/db'
import { eq, and, desc } from 'drizzle-orm'
import { getAuthenticatedUser } from '@/lib/api-helpers'
import { z } from 'zod'

// GET /api/library/[userBookId]/progress
export async function GET(_req: Request, { params }: { params: Promise<{ userBookId: string }> }) {
  const { dbUser, error } = await getAuthenticatedUser()
  if (error) return error
  const { userBookId } = await params

  const entries = await db
    .select()
    .from(progressEntries)
    .where(eq(progressEntries.userBookId, userBookId))
    .orderBy(desc(progressEntries.loggedAt))
    .limit(50)

  return NextResponse.json({ data: entries })
}

const progressSchema = z.object({
  page: z.number().int().min(0),
  pageCount: z.number().int().min(1).optional(),
  note: z.string().max(500).optional(),
})

// POST /api/library/[userBookId]/progress
export async function POST(req: Request, { params }: { params: Promise<{ userBookId: string }> }) {
  const { dbUser, error } = await getAuthenticatedUser()
  if (error) return error
  const { userBookId } = await params

  // Verify ownership
  const [userBook] = await db
    .select()
    .from(userBooks)
    .where(and(eq(userBooks.id, userBookId), eq(userBooks.userId, dbUser!.id)))
    .limit(1)
  if (!userBook) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = progressSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { page, pageCount, note } = parsed.data
  const percent = pageCount ? Math.min(page / pageCount, 1) : 0

  const [entry] = await db
    .insert(progressEntries)
    .values({ userBookId, page, percent, note: note ?? null })
    .returning()

  // Auto-update shelf to 'reading' if it was 'want_to_read'
  if (userBook.shelf === 'want_to_read') {
    await db
      .update(userBooks)
      .set({ shelf: 'reading', startedAt: new Date().toISOString().split('T')[0]!, updatedAt: new Date() })
      .where(eq(userBooks.id, userBookId))
  }

  return NextResponse.json({ data: entry }, { status: 201 })
}
