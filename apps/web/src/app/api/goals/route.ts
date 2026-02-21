import { NextResponse } from 'next/server'
import { db, userGoals } from '@readrise/db'
import { eq, and } from 'drizzle-orm'
import { getAuthenticatedUser } from '@/lib/api-helpers'
import { z } from 'zod'

// GET /api/goals?year=2026
export async function GET(request: Request) {
  const { dbUser, error } = await getAuthenticatedUser()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))

  const goals = await db
    .select()
    .from(userGoals)
    .where(and(eq(userGoals.userId, dbUser!.id), eq(userGoals.year, year)))

  return NextResponse.json({ data: goals })
}

const goalSchema = z.object({
  year: z.number().int().min(2020).max(2100).default(() => new Date().getFullYear()),
  goalType: z.enum(['book_count']).default('book_count'),
  target: z.number().int().min(1).max(10000),
})

// POST /api/goals — create or update
export async function POST(request: Request) {
  const { dbUser, error } = await getAuthenticatedUser()
  if (error) return error

  const body = await request.json()
  const parsed = goalSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const [goal] = await db
    .insert(userGoals)
    .values({ userId: dbUser!.id, ...parsed.data })
    .onConflictDoUpdate({
      target: [userGoals.userId, userGoals.year, userGoals.goalType],
      set: { target: parsed.data.target, updatedAt: new Date() },
    })
    .returning()

  return NextResponse.json({ data: goal })
}
