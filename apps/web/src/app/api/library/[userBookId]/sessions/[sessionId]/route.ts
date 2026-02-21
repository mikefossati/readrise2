import { NextResponse } from 'next/server'
import { db, readingSessions, userBooks } from '@readrise/db'
import { eq, and } from 'drizzle-orm'
import { getAuthenticatedUser } from '@/lib/api-helpers'
import { z } from 'zod'

const endSessionSchema = z.object({
  pagesEnd: z.number().int().min(0).optional(),
  note: z.string().max(500).optional(),
})

// PATCH /api/library/[userBookId]/sessions/[sessionId] — end a session
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userBookId: string; sessionId: string }> }
) {
  const { dbUser, error } = await getAuthenticatedUser()
  if (error) return error
  const { userBookId, sessionId } = await params

  // Verify ownership via userBook
  const [userBook] = await db
    .select()
    .from(userBooks)
    .where(and(eq(userBooks.id, userBookId), eq(userBooks.userId, dbUser!.id)))
    .limit(1)
  if (!userBook) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [session] = await db
    .select()
    .from(readingSessions)
    .where(and(eq(readingSessions.id, sessionId), eq(readingSessions.userBookId, userBookId)))
    .limit(1)
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const parsed = endSessionSchema.safeParse(body)
  const { pagesEnd, note } = parsed.success ? parsed.data : {}

  const endedAt = new Date()
  const durationSeconds = Math.floor(
    (endedAt.getTime() - new Date(session.startedAt).getTime()) / 1000
  )
  const pagesRead =
    pagesEnd != null && session.pagesStart != null ? pagesEnd - session.pagesStart : null
  const pagesPerHour =
    pagesRead != null && durationSeconds > 0 ? (pagesRead / durationSeconds) * 3600 : null

  const [updated] = await db
    .update(readingSessions)
    .set({ endedAt, durationSeconds, pagesEnd: pagesEnd ?? null, pagesRead, pagesPerHour, note: note ?? null })
    .where(eq(readingSessions.id, sessionId))
    .returning()

  return NextResponse.json({ data: updated })
}
