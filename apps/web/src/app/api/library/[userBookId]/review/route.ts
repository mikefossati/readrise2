import { NextResponse } from 'next/server'
import { db, reviews, userBooks } from '@readrise/db'
import { eq, and } from 'drizzle-orm'
import { getAuthenticatedUser } from '@/lib/api-helpers'
import { z } from 'zod'

// GET /api/library/[userBookId]/review
export async function GET(_req: Request, { params }: { params: Promise<{ userBookId: string }> }) {
  const { error } = await getAuthenticatedUser()
  if (error) return error
  const { userBookId } = await params

  const [review] = await db
    .select()
    .from(reviews)
    .where(eq(reviews.userBookId, userBookId))
    .limit(1)

  return NextResponse.json({ data: review ?? null })
}

const reviewSchema = z.object({
  rating: z.number().min(1).max(5).multipleOf(0.5),
  body: z.string().max(5000).nullish(),
})

// PUT /api/library/[userBookId]/review — upsert
export async function PUT(req: Request, { params }: { params: Promise<{ userBookId: string }> }) {
  const { dbUser, error } = await getAuthenticatedUser()
  if (error) return error
  const { userBookId } = await params

  const [userBook] = await db
    .select()
    .from(userBooks)
    .where(and(eq(userBooks.id, userBookId), eq(userBooks.userId, dbUser!.id)))
    .limit(1)
  if (!userBook) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const [review] = await db
    .insert(reviews)
    .values({ userBookId, rating: parsed.data.rating, body: parsed.data.body ?? null })
    .onConflictDoUpdate({
      target: reviews.userBookId,
      set: { rating: parsed.data.rating, body: parsed.data.body ?? null, updatedAt: new Date() },
    })
    .returning()

  return NextResponse.json({ data: review })
}
