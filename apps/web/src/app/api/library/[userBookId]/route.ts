import { NextResponse } from 'next/server'
import { db, userBooks, books } from '@readrise/db'
import { eq, and } from 'drizzle-orm'
import { getAuthenticatedUser } from '@/lib/api-helpers'
import { z } from 'zod'

// GET /api/library/[userBookId]
export async function GET(_req: Request, { params }: { params: Promise<{ userBookId: string }> }) {
  const { dbUser, error } = await getAuthenticatedUser()
  if (error) return error
  const { userBookId } = await params

  const [row] = await db
    .select()
    .from(userBooks)
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .where(and(eq(userBooks.id, userBookId), eq(userBooks.userId, dbUser!.id)))
    .limit(1)

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: row })
}

const updateSchema = z.object({
  shelf: z.enum(['reading', 'want_to_read', 'finished', 'abandoned']).optional(),
  format: z.enum(['physical', 'ebook', 'audiobook']).optional(),
  startedAt: z.string().nullable().optional(),
  finishedAt: z.string().nullable().optional(),
  abandonedAt: z.string().nullable().optional(),
})

// PATCH /api/library/[userBookId]
export async function PATCH(req: Request, { params }: { params: Promise<{ userBookId: string }> }) {
  const { dbUser, error } = await getAuthenticatedUser()
  if (error) return error
  const { userBookId } = await params

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const [updated] = await db
    .update(userBooks)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(userBooks.id, userBookId), eq(userBooks.userId, dbUser!.id)))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: updated })
}

// DELETE /api/library/[userBookId]
export async function DELETE(_req: Request, { params }: { params: Promise<{ userBookId: string }> }) {
  const { dbUser, error } = await getAuthenticatedUser()
  if (error) return error
  const { userBookId } = await params

  await db
    .delete(userBooks)
    .where(and(eq(userBooks.id, userBookId), eq(userBooks.userId, dbUser!.id)))

  return NextResponse.json({ data: null }, { status: 200 })
}
