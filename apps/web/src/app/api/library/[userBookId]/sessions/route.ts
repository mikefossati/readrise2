import { NextResponse } from 'next/server'
import { db, readingSessions, userBooks } from '@readrise/db'
import { eq, and, desc, isNull } from 'drizzle-orm'
import { getAuthenticatedUser } from '@/lib/api-helpers'
import { z } from 'zod'

// GET /api/library/[userBookId]/sessions
export async function GET(_req: Request, { params }: { params: Promise<{ userBookId: string }> }) {
  const { error } = await getAuthenticatedUser()
  if (error) return error
  const { userBookId } = await params

  const sessions = await db
    .select()
    .from(readingSessions)
    .where(eq(readingSessions.userBookId, userBookId))
    .orderBy(desc(readingSessions.startedAt))
    .limit(50)

  return NextResponse.json({ data: sessions })
}

const startSessionSchema = z.object({
  pagesStart: z.number().int().min(0).optional(),
})

// POST /api/library/[userBookId]/sessions — start a session
export async function POST(req: Request, { params }: { params: Promise<{ userBookId: string }> }) {
  const { dbUser, error } = await getAuthenticatedUser()
  if (error) return error
  const { userBookId } = await params

  const [userBook] = await db
    .select()
    .from(userBooks)
    .where(and(eq(userBooks.id, userBookId), eq(userBooks.userId, dbUser!.id)))
    .limit(1)
  if (!userBook) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // End any currently active session for this book
  await db
    .update(readingSessions)
    .set({ endedAt: new Date() })
    .where(and(eq(readingSessions.userBookId, userBookId), isNull(readingSessions.endedAt)))

  const body = await req.json().catch(() => ({}))
  const parsed = startSessionSchema.safeParse(body)
  const pagesStart = parsed.success ? parsed.data.pagesStart : undefined

  const [session] = await db
    .insert(readingSessions)
    .values({ userBookId, startedAt: new Date(), pagesStart: pagesStart ?? null })
    .returning()

  return NextResponse.json({ data: session }, { status: 201 })
}
